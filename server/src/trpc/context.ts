import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { AuthInstance } from "../auth/config";
import { db } from "../db";
import { fromNodeHeaders } from "better-auth/node";

// Create context for tRPC requests
export async function createContext(
  { req, res }: CreateExpressContextOptions,
  auth: AuthInstance
) {
  // Get user session from better-auth
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return {
    req,
    res,
    db,
    user: session?.user || null,
    auth,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
