// src/api.ts
import { auth } from "@/auth/configs/auth.config";
import { graphqlSchema } from "@/graphql/schema";
import { createBetterAuthMiddleware } from "@/middleware/auth.middleware";
import { errorHandler } from "@/middleware/error.middleware";
import { subscriptionCheckMiddleware } from "@/middleware/subscription.middleware";
import { subscriptionService } from "@/services/subscription.service";
import { trialService } from "@/services/trial.service";
import { handleFlutterwaveWebhook } from "@/webhooks/flutterwave";
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createYoga } from "graphql-yoga";

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
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Special route for Flutterwave webhooks (needs raw body)
  app.post(
    "/api/webhooks/flutterwave",
    express.raw({ type: "application/json" }),
    handleFlutterwaveWebhook
  );

  // Regular JSON parsing for other routes
  app.use(express.json());

  // Auth middleware
  app.use(createBetterAuthMiddleware(auth));

  // Subscription check middleware
  app.use(subscriptionCheckMiddleware);

  // Set up GraphQL Yoga
  const yoga = createYoga({
    schema: graphqlSchema,
    context: ({ request }) => {
      // Extract user from request (set by auth middleware)
      const user = (request as any).user;
      const activeOrganization = (request as any).activeOrganization;

      return {
        user,
        activeOrganization,
        services: {
          trialService,
          subscriptionService,
        },
      };
    },
  });

  // Mount GraphQL endpoint
  app.use("/api/graphql", yoga);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
