import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error caught by middleware:", err);

  // Check for specific error types
  if (err.name === "PaymentRequiredError") {
    return res.status(402).json({
      error: "Payment Required",
      message:
        err.message || "Your trial has expired. Please subscribe to continue.",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
    });
  }

  if (err.name === "AuthorizationError") {
    return res.status(403).json({
      error: "Authorization Error",
      message:
        err.message || "You don't have permission to access this resource",
    });
  }

  // Default error response
  return res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
}