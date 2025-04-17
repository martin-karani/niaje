import { betterAuth } from "@infrastructure/auth/better-auth";
import { createAuthMiddleware } from "@infrastructure/auth/middleware";
import { createGraphQLContext } from "@infrastructure/graphql/context/context-provider";
import { schema } from "@infrastructure/graphql/schema";
import { handleWebhooks } from "@infrastructure/webhooks";
import { errorHandler } from "@shared/errors/error.middleware";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createYoga } from "graphql-yoga";
import path from "path";
import { uploadRoutes } from "./api/routes/upload.routes";

export function setupApi() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.use(cookieParser());
  app.use("/api/auth", betterAuth.handler());

  // Serve static files from uploads directory
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Handle webhooks (raw body for signature verification)
  app.post(
    "/api/webhooks/:provider",
    express.raw({ type: "application/json" }),
    handleWebhooks
  );

  // Normal JSON processing for other routes
  app.use(express.json());
  app.use(createAuthMiddleware());

  // File upload routes
  app.use("/api/upload", uploadRoutes);

  // GraphQL endpoint
  const yoga = createYoga({
    schema,
    graphqlEndpoint: "/api/graphql",
    context: async ({ request }) => createGraphQLContext(request),
  });

  app.use("/api/graphql", yoga);

  // Error handler middleware (must be last)
  app.use(errorHandler);

  return app;
}
