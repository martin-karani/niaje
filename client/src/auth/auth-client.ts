import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    baseURL: process.env.PUBLIC_API_URL || "http://localhost:3001",
    basePath: "/api/auth", // Match backend configuration
    credentials: "include",

    endpoints: {
      getSession: "/get-session",
      signIn: "/signin/email",
      signUp: "/signup/email",
      signOut: "/signout",
      verifyEmail: "/verify-email",
    },

    // Cookie configuration
    cookies: {
      session: {
        name: "session-token",
      },
    },

    // Storage configuration for client-side
    storage: "cookies", // Use cookies for token storage
  });
