import express from "express";

/**
 * Setup main API routes
 */
export const apiRoutes = express.Router();

// Health check route
apiRoutes.get("/api/healthcheck", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
