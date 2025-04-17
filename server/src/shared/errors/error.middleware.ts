import { NextFunction, Request, Response } from "express";
import { AuthorizationError } from "./authorization.error";
import { NotFoundError } from "./not-found.error";
import { SubscriptionLimitError } from "./subscription-limit.error";
import { ValidationError } from "./validation.error";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      error: "Authorization Error",
      message:
        err.message || "You don't have permission to access this resource",
    });
  }

  if (err instanceof SubscriptionLimitError) {
    return res.status(402).json({
      error: "Subscription Limit Reached",
      message: err.message || "You have reached a subscription limit",
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message || "Invalid input data",
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: "Not Found",
      message: err.message || "Requested resource not found",
    });
  }

  return res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
}
