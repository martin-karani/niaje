import { auth } from "@/auth/configs/auth.config";
import { createBetterAuthMiddleware } from "@/middleware/auth.middleware";
import { errorHandler } from "@/middleware/error.middleware";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRoutes } from "./auth/routes/auth.route";
import { trpcMiddleware } from "./trpc";

/**
 * Setup Express application
 */
export function setupApi() {
  const app = express();

  // Global middleware
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.use(cookieParser());

  // Mount better-auth handler for all /api/auth/* routes
  // IMPORTANT: Place this before express.json() middleware
  app.use("/api/auth/*splat", authRoutes);

  app.use(express.json());

  // Create an auth middleware to get session data for non-auth routes
  app.use(createBetterAuthMiddleware(auth));

  // Mount tRPC
  app.use(trpcMiddleware);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
