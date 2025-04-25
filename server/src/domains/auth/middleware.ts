import { subscriptionService } from "@/domains/billing/services/subscription.service";
import { teamsService } from "@/domains/organizations/services";
import { NextFunction, Request, Response } from "express";
import { PermissionChecker } from "./permission-checker";
import { organizationService, sessionService } from "./services";

/**
 * Unified middleware to extract user session, organization, team, and permissions
 * This middleware standardizes auth across the application for both REST and GraphQL
 */
export function createAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Clear previously set auth data
      delete req.user;
      delete req.activeOrganization;
      delete req.activeTeam;
      delete req.permissions;
      delete req.features;
      delete req.permissionChecker;

      // Get auth session from cookie token
      const sessionToken = req.cookies?.auth_token;

      // If no token, continue as unauthenticated
      if (!sessionToken) {
        return next();
      }

      try {
        // Get session details
        const session = await sessionService.getSessionByToken(sessionToken);

        // If no session or invalid session, continue as unauthenticated
        if (!session?.user) {
          return next();
        }

        // Attach user to request
        req.user = session.user;

        // Get active organization from session data
        if (session.data?.activeOrganizationId) {
          try {
            // Fetch organization details
            const organization = await organizationService.getOrganizationById(
              session.data.activeOrganizationId
            );

            if (organization) {
              req.activeOrganization = organization;

              // Get subscription features
              const features =
                await subscriptionService.getSubscriptionFeatures(
                  organization.id
                );
              req.features = features;

              // Check if session has an active team
              if (session.data.activeTeamId) {
                try {
                  const team = await teamsService.getTeamById(
                    session.data.activeTeamId
                  );
                  // Only set active team if it belongs to the active organization
                  if (team.organizationId === organization.id) {
                    req.activeTeam = team;
                  }
                } catch (error) {
                  // Team not found, continue without active team
                  console.warn("Error fetching active team:", error);
                }
              }

              // Create permission checker
              req.permissionChecker = new PermissionChecker(
                session.user,
                organization,
                req.activeTeam || null
              );
            }
          } catch (error) {
            // Organization not found, continue without active org
            console.warn("Error fetching active organization:", error);
          }
        }
      } catch (error) {
        // Session invalid or expired, continue as unauthenticated
        console.warn("Session verification error:", error);
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next();
    }
  };
}

/**
 * Middleware to require authentication
 */
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }
    next();
  };
}

/**
 * Middleware to require active organization
 */
export function requireOrganization() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!req.activeOrganization) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No active organization selected",
      });
    }

    next();
  };
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check authentication and organization
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!req.activeOrganization) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No active organization selected",
      });
    }

    // If no specific permission required, proceed
    if (!permission) {
      return next();
    }

    // Use permission checker to verify access
    try {
      // Map permission string to resource type and action
      // This is a simplified example - you would need to expand this based on your permission model
      const [resourceType, action] = permission.split(":");

      if (!req.permissionChecker) {
        return res.status(500).json({
          error: "Server Error",
          message: "Permission checker not initialized",
        });
      }

      // Check if user has permission
      const hasPermission = await req.permissionChecker.can(
        resourceType || "global",
        action || permission
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: "Forbidden",
          message: `You don't have permission to access this resource`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(403).json({
        error: "Forbidden",
        message: "Permission denied",
      });
    }
  };
}

// Add to Express Request type to standardize auth properties
declare global {
  namespace Express {
    interface Request {
      user?: any;
      activeOrganization?: any;
      activeTeam?: any;
      permissions?: Record<string, boolean>;
      features?: {
        maxProperties: number;
        maxUsers: number;
        advancedReporting: boolean;
        documentStorage: boolean;
      };
      permissionChecker?: PermissionChecker;
    }
  }
}
