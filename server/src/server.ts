import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import auth from "@/auth/config";
import { createBetterAuthMiddleware } from "@/auth/middleware";
import { createContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(cookieParser());

// Mount better-auth handler for all /api/auth/* routes
// IMPORTANT: Place this before express.json() middleware
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Create an auth middleware to get session data for non-auth routes
app.use(createBetterAuthMiddleware(auth));

// Server health check
app.get("/api/healthcheck", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Create tRPC express middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: (opts) => createContext(opts, auth),
  })
);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`TRPC endpoint: http://localhost:${PORT}/api/trpc`);
  console.log(`Auth endpoint: http://localhost:${PORT}/api/auth`);
});
