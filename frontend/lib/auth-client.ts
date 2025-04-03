// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    // Base URL for API requests
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    basePath: "/api/auth", // Match backend configuration
    credentials: "include",

    // Define the specific endpoints
    endpoints: {
      getSession: "/session",
      signIn: "/signin/email",
      signUp: "/signup/email",
      signOut: "/signout",
      verifyEmail: "/verify-email",
    },

    // Cookie configuration
    cookies: {
      // Names should match backend
      session: {
        name: "session-token",
      },
    },

    // Storage configuration for client-side
    storage: "cookies", // Use cookies for token storage

    // Options configuration
    options: {
      redirects: {
        signIn: "/sign-in",
        signUp: "/sign-up",
        afterSignIn: "/dashboard",
        afterSignOut: "/",
      },
      extractors: {
        user: (response: any) => ({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
          image: response.image,
        }),
      },
    },
  });
