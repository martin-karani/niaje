// src/auth/configs/auth.config.ts
import { createStripeCustomer } from "@/lib/payment";
import { emailService } from "@/services/email.service";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { addMonths } from "date-fns";
import dotenv from "dotenv";
import { db } from "../../db";
import { ac, agent, caretaker, owner } from "../permissions";

dotenv.config();

const authSecret =
  process.env.BETTER_AUTH_SECRET || "better-auth-secret-123456789";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";

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
      ac,
      roles: {
        owner,
        caretaker,
        agent,
      },
      teams: {
        enabled: true,
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
            const customer = await createStripeCustomer(user.email, user.name, {
              organizationId: organization.id,
              userId: user.id,
            });

            // Update organization with customer ID
            await db
              .update(db.organization)
              .set({
                customerId: customer.id,
                updatedAt: new Date(),
              })
              .where(eq(db.organization.id, organization.id));

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
