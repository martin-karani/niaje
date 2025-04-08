import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    baseURL: "http://localhost:3001",
    basePath: "/api/auth",
    credentials: "include",

    endpoints: {
      getSession: "/get-session",
      signIn: "/signin/email",
      signUp: "/signup/email",
      signOut: "/signout",
      verifyEmail: "/verify-email",
    },

    cookies: {
      session: {
        name: "session-token",
      },
    },

    storage: "cookies",
  });
