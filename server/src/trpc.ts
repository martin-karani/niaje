import { createContext } from "@/trpc/context";
import { appRouter } from "@/trpc/router";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import auth from "./auth/configs/auth.config";

/**
 * Create tRPC express middleware
 */
export const trpcMiddleware = express.Router();

// Mount tRPC on /api/trpc
trpcMiddleware.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: (opts) => createContext(opts, auth),
  })
);
