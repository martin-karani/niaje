import { paymentGatewayService } from "@/domains/billing/services/payment-gateway.service";
import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { db } from "@/infrastructure/database";
import { emailService } from "@/infrastructure/email/email.service";
import { AUTH_CONFIG } from "@/shared/constants/enviroment";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  defaultStatements,
  openAPI,
  organization,
} from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { addMonths } from "date-fns";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config();

const authSecret =
  process.env.BETTER_AUTH_SECRET || "better-auth-secret-123456789";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";

const statements = {
  ...defaultStatements,
  property: ["create", "read", "update", "delete", "assign"],
  tenant: ["create", "read", "update", "delete", "contact"],
  lease: ["create", "read", "update", "delete", "renew", "terminate"],
  payment: ["create", "read", "update", "delete", "process", "refund"],
  maintenance: ["create", "read", "update", "delete", "assign", "complete"],
  report: ["create", "read", "export"],
  settings: ["read", "update"],
} as const;

// Create access control
const ac = createAccessControl(statements);

/**
 * Define all available roles in the system
 */
const availableRoles = [
  "admin", // System administrator
  "agent_owner", // Property management company owner
  "agent_staff", // Property management staff
  "property_owner", // Individual property owner
  "caretaker", // Property caretaker
  "tenant_user", // Tenant portal user
];

const authOptions: BetterAuthOptions = {
  appName: "Property Management System",
  baseURL: baseUrl,
  basePath: "/api/auth",
  secret: authSecret,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: "users",
      session: "sessions",
      organization: "organizations",
      team: "teams",
      member: "members",
      invitation: "invitations",
    },
  }),

  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
    organization({
      ac,
      roles: availableRoles,
      teams: {
        enabled: true,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `https://example.com/accept-invitation/${data.id}`;
        sendOrganizationInvitation({
          email: data.email,
          invitedByUsername: data.inviter.user.name,
          invitedByEmail: data.inviter.user.email,
          teamName: data.organization.name,
          inviteLink,
        });
      },
      organizationCreation: {
        disabled: false,
        beforeCreate: async ({ organization, user }, request) => {
          // Calculate trial expiration date (1 month from now)
          const trialExpiresAt = addMonths(new Date(), 1);

          return {
            data: {
              ...organization,
              metadata: {
                trialStatus: "active",
                trialStartedAt: new Date(),
                trialExpiresAt,
                subscriptionStatus: "none",
                maxProperties: 5, // Trial limits
                maxUsers: 3,
              },
            },
          };
        },
        afterCreate: async ({ organization, member, user }) => {
          try {
            // Create customer in payment system
            const customer = await paymentGatewayService.createCustomerId(
              user.email,
              user.name,
              {
                organizationId: organization.id,
                userId: user.id,
              }
            );

            // Update organization with customer ID
            await db
              .update(organizationEntity)
              .set({
                customerId: customer.id,
                updatedAt: new Date(),
              })
              .where(eq(organizationEntity.id, organization.id));

            // Send welcome email
            await emailService.sendTrialWelcomeEmail(
              user.email,
              user.name,
              organization.name,
              organization.metadata.trialExpiresAt
            );
          } catch (error) {
            console.error("Error in organization afterCreate hook:", error);
          }
        },
      },
    }),
    openAPI(),
  ],
  socialProviders: {
    google: {
      clientId: AUTH_CONFIG.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: `${baseUrl}/api/auth/social/google/callback`,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token }) => {
      console.log(
        `Sending reset password email to ${user.email} with token ${token} and url ${url}`
      );
    },
    resetPasswordTokenExpiresIn: 3600,
    password: {
      hash: async (password) => {
        // Hash the password using bcrypt or any other hashing algorithm
        return password; // Replace with actual hashing logic
      },
      verify: async (password, hashedPassword) => {
        // Verify the password against the hashed password
        return password === hashedPassword; // Replace with actual verification logic
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await emailService.sendVerificationEmail({ user, url, token });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 hour
  },

  user: {
    fields: {},
    additionalFields: {
      phone: { type: "string", required: false },
      role: { type: "string", required: true },
      isActive: { type: "boolean", required: true, defaultValue: true },
      emailVerified: { type: "boolean", required: true, defaultValue: false },
      image: { type: "string", required: false },
      address: { type: "string", required: false },
      city: { type: "string", required: false },
      country: { type: "string", required: false },
      bio: { type: "string", required: false },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
        await emailService.sendChangeEmailVerification({
          user,
          newEmail,
          url,
          token,
        });
      },
    },
    deleteUser: { enabled: false },
  },

  session: {
    expiresIn: 604800,
    updateAge: 86400,
    storeSessionInDatabase: true,
    preserveSessionInDatabase: false,
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },

  rateLimit: {
    enabled: true,
    max: 100,
    window: 15 * 60 * 1000, // 15 minutes
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    disableCSRFCheck: process.env.NODE_ENV !== "production",
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const organization = await getActiveOrganization(session.userId);
          return {
            data: {
              ...session,
              activeOrganizationId: organization.id,
            },
          };
        },
      },
    },
  },

  onAPIError: {
    throw: false,
    onError: (error, ctx) => {
      console.error(`Better Auth API Error (${ctx?.path}):`, error);
    },
    errorURL: "/auth/error",
  },
};

export const auth = betterAuth(authOptions);
export type AuthInstance = ReturnType<typeof betterAuth>;

// Export AC and determinePermissions for use in GraphQL context
export { determinePermissions } from "../permissions";
export { AC } from "./access-control";
