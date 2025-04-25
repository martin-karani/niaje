import { createGraphQLContext } from "@/infrastructure/graphql/context/context-provider";
import { schema } from "@/infrastructure/graphql/schema";
import { handleWebhooks } from "@/infrastructure/webhooks";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createYoga, useErrorHandler } from "graphql-yoga";
import { createAuthMiddleware } from "./domains/auth/middleware";
import { SERVER_CONFIG } from "./shared/constants/enviroment";

/**
 * Set up the Express API with authentication and GraphQL
 */
export function setupApi() {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: SERVER_CONFIG.FRONTEND_URL,
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
  // app.use("/api/upload", uploadRoutes);

  // GraphQL endpoint
  const yoga = createYoga({
    renderGraphiQL: () => {
      return `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin: 0; overflow-x: hidden; overflow-y: hidden">
          <div id="sandbox" style="height:100vh; width:100vw;"></div>
          <script src="https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js"></script>
          <script>
          new window.EmbeddedSandbox({
            target: "#sandbox",
            // Pass through your server href if you are embedding on an endpoint.
            // Otherwise, you can pass whatever endpoint you want Sandbox to start up with here.
            initialEndpoint: "http://localhost:3001/api/graphql",
          });
          // advanced options: https://www.apollographql.com/docs/studio/explorer/sandbox#embedding-sandbox
          </script>
          </body>
        </html>`;
    },
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
