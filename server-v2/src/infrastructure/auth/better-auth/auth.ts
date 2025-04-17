import { paymentGatewayService } from "@/domains/billing/services/payment-gateway.service";
import { emailService } from "@/domains/communications/services/email.service";
import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { db } from "@/infrastructure/database";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { addMonths } from "date-fns";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config();

const authSecret =
  process.env.BETTER_AUTH_SECRET || "better-auth-secret-123456789";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";

/**
 * Define access control resources and actions
 *
 * This defines what types of resources and actions exist in the system,
 * but doesn't grant permissions - that's handled by the AC class.
 */
const resources = {
  property: ["create", "update", "delete", "view"],
  tenant: ["create", "approve", "remove", "view", "manage"],
  lease: ["create", "update", "view"],
  maintenance: ["create", "update", "view", "manage"],
  staff: ["assign", "remove", "view"],
  financial: ["view", "manage", "record", "invoice", "view_limited"],
  communication: ["tenant", "landlord", "caretaker"],
  tenant_portal: ["access", "make_payment", "view_lease", "create_maintenance"],
};

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
  }),

  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
    organization({
      // Instead of using the old ac and role definitions,
      // we'll use a simpler configuration and rely on our custom AC class
      // for runtime permission checks
      roles: availableRoles,
      teams: {
        enabled: true,
        access: {
          // Configure how teams affect access control
          membersCanViewAllOrganizationData: false, // Restrict access to team data only
          teamAdminRole: "team_leader", // Special role for team leaders
          allowRoleOverride: true, // Allow team-specific role customization
        },
        creation: {
          membersCanCreateTeams: false, // Only org owners can create teams
        },
        invitation: {
          allowDirectTeamInvites: true, // Team leaders can invite directly to their team
        },
      },
      organizationCreation: {
        disabled: false,
        beforeCreate: async ({ organization, user }) => {
          // Calculate trial expiration date (1 month from now)
          const trialExpiresAt = addMonths(new Date(), 1);

          return {
            data: {
              ...organization,
              trialStatus: "active",
              trialStartedAt: new Date(),
              trialExpiresAt,
              subscriptionStatus: "none",
              maxProperties: 5, // Trial limits
              maxUsers: 3,
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
              organization.trialExpiresAt
            );
          } catch (error) {
            console.error("Error in organization afterCreate hook:", error);
          }
        },
      },
    }),
  ],

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
    changeEmail: { enabled: false },
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

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    disableCSRFCheck: process.env.NODE_ENV !== "production",
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log(`User created via better-auth hook: ${user.email}`);
        },
      },
    },
  },

  onAPIError: {
    throw: false,
    onError: (error, ctx) => {
      console.error(`Better Auth API Error (${ctx?.path}):`, error.message);
    },
    errorURL: "/auth/error",
  },
};

export const auth = betterAuth(authOptions);
export type AuthInstance = ReturnType<typeof betterAuth>;

// Export AC and determinePermissions for use in GraphQL context
export { determinePermissions } from "../permissions";
export { AC } from "./access-control";
