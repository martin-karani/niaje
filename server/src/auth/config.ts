import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import dotenv from "dotenv";

dotenv.config();

export type AuthInstance = ReturnType<typeof betterAuth>;

const authSecret = process.env.AUTH_SECRET || "better-auth-secret-123456789";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";

export function createAuthInstance(): AuthInstance {
  const authOptions: BetterAuthOptions = {
    appName: "Property Management System",
    baseURL: baseUrl,
    basePath: "/auth",
    secret: authSecret,

    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set as needed
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      sendResetPassword: async ({ user, url, token }) => {
        // Implement your email sending logic here
        console.log(
          `Sending reset password email to ${user.email} with token ${token} and url ${url}`
        );
        // Example: await emailService.sendPasswordReset(user.email, url);
      },
      resetPasswordTokenExpiresIn: 3600, // 1 hour
    },

    // User Configuration
    user: {
      fields: {
        // Map fields if your model uses different names than better-auth expects
      },
      additionalFields: {
        phone: { type: "string", nullable: true },
        role: { type: "string", nullable: false },
        isActive: { type: "boolean", nullable: false },
        emailVerified: { type: "boolean", nullable: false },
        image: { type: "string", nullable: true },
        address: { type: "string", nullable: true },
        city: { type: "string", nullable: true },
        country: { type: "string", nullable: true },
        bio: { type: "string", nullable: true },
      },
      // Email change and user deletion configs
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
    },

    // Session Configuration
    session: {
      expiresIn: 604800, // 7 days
      updateAge: 86400, // 1 day
      storeSessionInDatabase: true, // Important if using DB for sessions
      preserveSessionInDatabase: false, // Delete expired sessions from DB
      cookieCache: {
        enabled: true,
        maxAge: 300, // 5 minutes
      },
    },

    // Advanced Settings
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production", // Use secure cookies in prod
      // Add trusted origins if your frontend is on a different domain
      // trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    },

    // Database Hooks (if needed for specific actions before/after DB operations)
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            console.log(`User created via better-auth hook: ${user.email}`);
            // Example: Initialize user profile or send welcome email
          },
        },
      },
    },

    // Error Handling
    onAPIError: {
      throw: false, // Don't throw, let Express handle errors or handle in onError
      onError: (error, ctx) => {
        console.error(`Better Auth API Error (${ctx?.path}):`, error.message);
        // Add custom logging or error reporting
      },
      errorURL: "/auth/error", // Redirect URL on error (client-side)
    },
  };

  return betterAuth(authOptions);
}

// Create and export a singleton instance
let authInstance: AuthInstance | null = null;

export function getAuthInstance() {
  if (!authInstance) {
    authInstance = createAuthInstance();
  }
  return authInstance;
}
