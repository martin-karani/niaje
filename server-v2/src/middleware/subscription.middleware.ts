import { subscriptionService } from "@/services/system/subscription.service";
import { trialService } from "@/services/system/trial.service";
import { NextFunction, Request, Response } from "express";

export async function subscriptionCheckMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip middleware for certain paths
  const skipPaths = [
    "/api/auth",
    "/api/webhooks",
    "/api/graphql/subscription",
    "/organization/billing",
    "/login",
    "/signup",
  ];

  if (skipPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  try {
    // Get active organization ID from session
    const organizationId = req.session?.activeOrganizationId;

    if (!organizationId) {
      return next(); // No active organization, proceed
    }

    // Check if organization has active trial or subscription
    const isInTrial = await trialService.isInTrial(organizationId);
    const hasSubscription =
      await subscriptionService.hasActiveSubscription(organizationId);

    if (!isInTrial && !hasSubscription) {
      // For API requests, return 402 Payment Required
      if (req.path.startsWith("/api/")) {
        return res.status(402).json({
          error: "Payment Required",
          message: "Your trial has expired. Please subscribe to continue.",
        });
      }

      // For web requests, redirect to billing page
      return res.redirect("/organization/billing?expired=true");
    }

    next();
  } catch (error) {
    console.error("Error checking subscription status:", error);
    next(); // Continue on error
  }
}
