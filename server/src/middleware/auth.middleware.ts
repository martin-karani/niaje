import { Permission } from "@/permissions/models";
import { permissionService } from "@/permissions/services/permissions.service";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { AuthInstance } from "../auth/configs/auth.config";

/**
 * Enhances the Request object with user and permission helpers
 */
export interface AuthenticatedRequest extends Request {
  user?: any;
  session?: any;
  hasPermission?: (permission: Permission) => Promise<boolean>;
  hasPropertyPermission?: (
    propertyId: string,
    permission: Permission
  ) => Promise<boolean>;
  getUserPermissions?: () => Promise<{
    systemPermissions: Permission[];
    propertyPermissions: { propertyId: string; permissions: Permission[] }[];
  }>;
}

/**
 * Creates middleware to handle Better Auth sessions
 */
export function createBetterAuthMiddleware(auth: AuthInstance) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get session from auth headers
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      // Attach the session to the request
      const authReq = req as AuthenticatedRequest;
      authReq.session = session;
      authReq.user = session?.user || null;

      // If user is authenticated, add permission helper methods
      if (authReq.user) {
        // Helper to check permissions
        authReq.hasPermission = async (permission: Permission) => {
          return permissionService.hasPermission(
            authReq.user.id,
            authReq.user.role,
            permission
          );
        };

        // Helper to check property permissions
        authReq.hasPropertyPermission = async (
          propertyId: string,
          permission: Permission
        ) => {
          return permissionService.hasPropertyPermission(
            authReq.user.id,
            authReq.user.role,
            propertyId,
            permission
          );
        };

        // Helper to get all user permissions
        authReq.getUserPermissions = async () => {
          return permissionService.getUserPermissions(
            authReq.user.id,
            authReq.user.role
          );
        };
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(); // Continue to next middleware even on error
    }
  };
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!authReq.hasPermission) {
      return res.status(500).json({ error: "Permission check failed" });
    }

    const hasPermission = await authReq.hasPermission(permission);
    if (!hasPermission) {
      return res.status(403).json({
        error: `You don't have the required permission: ${permission}`,
      });
    }

    next();
  };
}

/**
 * Middleware to require property-specific permission
 */
export function requirePropertyPermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get propertyId from request params or body
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    if (!authReq.hasPropertyPermission) {
      return res.status(500).json({ error: "Permission check failed" });
    }

    const hasPermission = await authReq.hasPropertyPermission(
      propertyId,
      permission
    );
    if (!hasPermission) {
      return res.status(403).json({
        error: `You don't have the required permission for this property: ${permission}`,
      });
    }

    next();
  };
}
