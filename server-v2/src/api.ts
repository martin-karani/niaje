import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createYoga } from "graphql-yoga";
import helmet from "helmet";

// Import your GraphQL schema and middleware/configurations
import { handleKorapayWebhook } from "@/api/webhooks/korapay";
import { auth } from "@/auth/configs/auth.config";
import { createBetterAuthMiddleware } from "@/middleware/auth.middleware";
import { organizationMiddleware } from "@/middleware/organization.middleware";
import { subscriptionCheckMiddleware } from "@/middleware/subscription.middleware";
import { graphqlSchema } from "./api/graphql/schema";

/**
 * Setup Express application with isolated GraphQL Yoga endpoint.
 */
export function setupApi() {
  const app = express();

  // Global middleware for all API endpoints
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );
  app.use(cookieParser());

  // Mount Better-Auth handler for authentication endpoints.
  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.post(
    "/api/webhooks/korapay",
    express.raw({ type: "application/json" }),
    handleKorapayWebhook
  );

  app.use(express.json());

  app.use(createBetterAuthMiddleware(auth));
  app.use(organizationMiddleware);
  app.use(subscriptionCheckMiddleware as express.RequestHandler);

  const yoga = createYoga({
    schema: graphqlSchema,
    graphqlEndpoint: "/api/graphql",
  });

  // Create an isolated router for GraphQL Yoga,
  // with custom CSP settings for GraphiQL.
  const graphqlRouter = express.Router();
  graphqlRouter.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "style-src": ["'self'", "unpkg.com"],
          "script-src": ["'self'", "unpkg.com", "'unsafe-inline'"],
          "img-src": ["'self'", "raw.githubusercontent.com"],
        },
      },
    })
  );
  graphqlRouter.use(yoga);

  app.use(yoga.graphqlEndpoint, graphqlRouter);

  // Global Helmet middleware for all other endpoints.
  app.use(helmet());

  // Example additional endpoint.
  app.get("/hello", (req, res) => {
    res.send("Hello World!");
  });

  return app;
}
