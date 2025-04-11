import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error caught by middleware:", err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      details: err.errors,
    });
  }

  // Handle custom error types based on name
  switch (err.name) {
    case "NotFoundError":
      return res.status(404).json({ error: err.message });

    case "PermissionError":
      return res.status(403).json({ error: err.message });

    case "ValidationError":
      return res.status(400).json({ error: err.message });

    case "ConflictError":
      return res.status(409).json({ error: err.message });

    case "UnauthorizedError":
      return res.status(401).json({ error: err.message || "Unauthorized" });

    // Internal server errors and unhandled errors
    default:
      return res.status(500).json({
        error:
          process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err.message || "Internal Server Error",
      });
  }
}
