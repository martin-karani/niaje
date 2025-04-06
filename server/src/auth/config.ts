import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import dotenv from "dotenv";

dotenv.config();

const authSecret = process.env.AUTH_SECRET || "better-auth-secret-123456789";
const baseUrl = process.env.BASE_URL || "http://localhost:3001";

const authOptions: BetterAuthOptions = {
  appName: "Property Management System",
  baseURL: baseUrl,
  basePath: "/api/auth",
  secret: authSecret,

  database: drizzleAdapter(getDb, {
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
      isActive: { type: "boolean", required: true },
      emailVerified: { type: "boolean", required: true },
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

// Also export as default for flexibility
export default auth;

export type AuthInstance = ReturnType<typeof betterAuth>;
