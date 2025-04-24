import { uploadRoutes } from "@/api/routes/upload.routes";
import { createGraphQLContext } from "@/infrastructure/graphql/context/context-provider";
import { schema } from "@/infrastructure/graphql/schema";
import { handleWebhooks } from "@/infrastructure/webhooks";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createYoga, useErrorHandler } from "graphql-yoga";
import { createAuthMiddleware } from "./infrastructure/auth/middleware";

/**
 * Set up the Express API with authentication and GraphQL
 */
export function setupApi() {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  // Parse cookies - needed for auth
  app.use(cookieParser());

  // Handle webhooks (raw body for signature verification)
  app.post(
    "/api/webhooks/:provider",
    express.raw({ type: "application/json" }),
    handleWebhooks
  );

  // Normal JSON processing for other routes
  app.use(express.json());

  // Apply authentication middleware to attach user and permissions
  app.use(createAuthMiddleware());

  // Mount auth routes

  // Mount file upload routes
  app.use("/api/upload", uploadRoutes);

  // GraphQL endpoint
  const yoga = createYoga({
    schema,
    graphqlEndpoint: "/api/graphql",
    context: async ({ request }) => createGraphQLContext(request as any),
    plugins: [
      useErrorHandler((error) => {
        console.error("GraphQL Error:", error);
        return error;
      }),
    ],
  });

  app.use("/api/graphql", yoga);

  return app;
}
