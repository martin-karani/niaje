import { auth } from "@/infrastructure/auth/better-auth/auth";
import { createAuthMiddleware } from "@/infrastructure/auth/middleware";
import { createGraphQLContext } from "@/infrastructure/graphql/context/context-provider";
import { schema } from "@/infrastructure/graphql/schema";
import { handleWebhooks } from "@/infrastructure/webhooks";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { createYoga } from "graphql-yoga";

/**
 * Set up the Express API with authentication and GraphQL
 */
export function setupApi() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  // app.use(cookieParser());

  // Mount Better-Auth routes
  app.use("/api/auth/*splat", toNodeHandler(auth));

  // Serve static files from uploads directory
  // app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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

  // File upload route
  // app.post("/api/upload/*splat", uploadRoutes);

  // GraphQL endpoint
  const yoga = createYoga({
    schema,
    graphqlEndpoint: "/api/graphql",
    context: async ({ request }) => createGraphQLContext(request as any),
  });

  app.use("/api/graphql", yoga);

  // Error handling middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("API Error:", err);
      res.status(err.statusCode || 500).json({
        error: err.name || "Internal Server Error",
        message: err.message || "An unexpected error occurred",
      });
    }
  );

  return app;
}
