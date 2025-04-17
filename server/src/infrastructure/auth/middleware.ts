import { teamsService } from "@/domains/organizations/services/team.service";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth } from "./better-auth/auth";
import { determinePermissions } from "./permissions";

/**
 * Create authentication middleware
 * Attaches user, organization, team, and permissions to request object
 */
export function createAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get auth session from better-auth
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (session) {
        // Attach user to request
        req.user = session.user;

        // Get active organization if available
        req.activeOrganization = session.activeOrganization;

        // Get active team if available
        req.activeTeam = session.activeTeam;

        // For tenant portal, check if there's an active tenant
        if (session.activeTenant) {
          req.activeTenant = session.activeTenant;
        }

        // Determine permissions based on user role, organization, and team
        req.permissions = await determinePermissions(
          session.user,
          session.activeOrganization,
          session.activeTeam
        );
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(error);
    }
  };
}

/**
 * Create middleware to require authentication
 * Use this to protect routes that require a logged-in user
 */
export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
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
 * Create middleware to require specific permissions
 * Use this to protect routes that require specific permissions
 *
 * @param permission The permission required to access the route
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!req.permissions || !req.permissions[permission]) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to access this resource",
      });
    }

    next();
  };
}

/**
 * Create middleware to check property access
 * Use this to protect routes that operate on specific properties
 */
export function requirePropertyAccess(propertyIdParam: string = "propertyId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Skip check for admins and organization owners
    if (
      req.user.role === "admin" ||
      (req.activeOrganization &&
        req.user.role === "agent_owner" &&
        req.activeOrganization.agentOwnerId === req.user.id)
    ) {
      return next();
    }

    const propertyId = req.params[propertyIdParam] || req.body[propertyIdParam];

    if (!propertyId) {
      return next(); // No property ID to check
    }

    // For users in teams, check if they have access to this property
    if (req.activeTeam) {
      try {
        const hasAccess = await teamsService.isPropertyInTeam(
          req.activeTeam.id,
          propertyId
        );

        if (!hasAccess) {
          return res.status(403).json({
            error: "Forbidden",
            message: "You don't have access to this property",
          });
        }
      } catch (error) {
        console.error("Property access check error:", error);
        // Continue even on error to avoid blocking legitimate requests
      }
    }

    next();
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
      activeOrganization?: any;
      activeTeam?: any;
      activeTenant?: any;
      permissions?: Record<string, boolean>;
    }
  }
}
