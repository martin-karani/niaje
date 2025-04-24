// src/infrastructure/auth/middleware.ts

import { NextFunction, Request, Response } from "express";
import { organizationService } from "./services/organization.service";
import { permissionService } from "./services/permission.service";
import { sessionService } from "./services/session.service";
import { teamService } from "./services/team.service";

/**
 * Middleware to extract user session, organization, and permissions
 */
export function createAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Clear previously set auth data
      delete req.user;
      delete req.activeOrganization;
      delete req.activeTeam;
      delete req.permissions;

      // Get auth token from cookies or authorization header
      const token = extractToken(req);

      if (!token) {
        // No token, continue as unauthenticated
        return next();
      }

      // Verify session and get user
      try {
        const session = await sessionService.getSessionByToken(token);

        // Attach user to request
        req.user = session.user;

        // Get active organization and team from session data
        if (session.data?.activeOrganizationId) {
          try {
            const org = await organizationService.getOrganizationById(
              session.data.activeOrganizationId
            );
            req.activeOrganization = org;

            // Check if session has an active team
            if (session.data?.activeTeamId) {
              try {
                const team = await teamService.getTeamById(
                  session.data.activeTeamId
                );
                // Only set active team if it belongs to the active organization
                if (team.organizationId === org.id) {
                  req.activeTeam = team;
                }
              } catch (error) {
                // Team not found or error fetching it, ignore and continue without active team
                console.warn("Error fetching active team:", error);
              }
            }
          } catch (error) {
            // Organization not found or error fetching it, ignore and continue without active org
            console.warn("Error fetching active organization:", error);
          }
        }

        // Extend session expiration if it's about to expire
        const expiryTime = session.expiresAt.getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 1 day in ms

        if (expiryTime - now < oneDay) {
          await sessionService.extendSession(token);
        }

        // Set session token in response cookie for persistence
        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });
      } catch (error) {
        // Session invalid or expired, clear cookie and continue as unauthenticated
        res.clearCookie("auth_token");
        return next();
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
export function requirePermission(resourceType: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
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

    try {
      const hasPermission = await permissionService.hasPermission({
        userId: req.user.id,
        organizationId: req.activeOrganization.id,
        resourceType,
        action,
      });

      if (!hasPermission) {
        return res.status(403).json({
          error: "Forbidden",
          message: `You don't have permission to ${action} ${resourceType}`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require property access
 */
export function requirePropertyAccess(propertyIdParam: string = "propertyId") {
  return async (req: Request, res: Response, next: NextFunction) => {
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

    try {
      const propertyId =
        req.params[propertyIdParam] || req.body[propertyIdParam];

      if (!propertyId) {
        return next(); // No property ID to check
      }

      const hasAccess = await permissionService.canAccessProperty(
        req.user.id,
        req.activeOrganization.id,
        propertyId
      );

      if (!hasAccess) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You don't have access to this property",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Extract token from request
 */
function extractToken(req: Request): string | null {
  // First check for cookie
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  // Then check for Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  return null;
}

// Add to Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
      activeOrganization?: any;
      activeTeam?: any;
      permissions?: Record<string, boolean>;
    }
  }
}
