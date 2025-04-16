import { graphqlSchema } from "@/api/graphql/schema";
import { handleFlutterwaveWebhook } from "@/api/webhooks/flutterwave";
import { auth } from "@/auth/configs/auth.config";
import { createBetterAuthMiddleware } from "@/middleware/auth.middleware";
import { errorHandler } from "@/middleware/error.middleware";
import { organizationMiddleware } from "@/middleware/organization.middleware";
import { subscriptionCheckMiddleware } from "@/middleware/subscription.middleware";
import { teamAccessMiddleware } from "@/middleware/team-access.middleware";
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

  // Organization context middleware
  app.use(organizationMiddleware);

  // Team access middleware for routes that need it
  app.use("/api/properties/:propertyId", teamAccessMiddleware);
  app.use("/api/units", teamAccessMiddleware);
  app.use("/api/maintenance", teamAccessMiddleware);

  // Subscription check middleware
  app.use(subscriptionCheckMiddleware);

  // Set up GraphQL Yoga
  const yoga = createYoga({
    schema: graphqlSchema,
    context: ({ request }) => {
      // Extract user from request (set by auth middleware)
      const user = (request as any).user;
      const activeOrganization = (request as any).activeOrganization;
      const activeTeam = (request as any).activeTeam;
      const activeTenant = (request as any).activeTenant;

      return {
        user,
        activeOrganization,
        activeTeam,
        activeTenant,
        services: {
          // Register all services for dependency injection
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
