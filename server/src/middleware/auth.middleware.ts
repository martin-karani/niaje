import { db } from "@/db";
import { properties, userPermissions } from "@/db/schema";
import { fromNodeHeaders } from "better-auth/node";
import { and, eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { AuthInstance } from "../configs/auth.config";

/**
 * Enhances the Request object with user and permission helpers
 */
export interface AuthenticatedRequest extends Request {
  user?: any;
  session?: any;
  isPropertyOwner?: (propertyId: string) => Promise<boolean>;
  hasPropertyPermission?: (
    propertyId: string,
    permissionType?: string
  ) => Promise<boolean>;
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
        // Helper to check if user is property owner
        authReq.isPropertyOwner = async (propertyId: string) => {
          const property = await db.query.properties.findFirst({
            where: and(
              eq(properties.id, propertyId),
              eq(properties.ownerId, authReq.user.id)
            ),
          });
          return Boolean(property);
        };

        // Helper to check property permissions
        authReq.hasPropertyPermission = async (
          propertyId: string,
          permissionType?: string
        ) => {
          // Admin always has all permissions
          if (authReq.user.role === "ADMIN") return true;

          // Check if user is property owner
          const isOwner = await db.query.properties.findFirst({
            where: and(
              eq(properties.id, propertyId),
              eq(properties.ownerId, authReq.user.id)
            ),
          });

          if (isOwner) return true;

          // Check specific permission
          if (permissionType) {
            const permissionField = getPermissionField(permissionType);
            if (!permissionField) return false;

            const permission = await db.query.userPermissions.findFirst({
              where: and(
                eq(userPermissions.userId, authReq.user.id),
                eq(userPermissions.propertyId, propertyId)
              ),
            });

            return (
              permission &&
              permission[permissionField as keyof typeof permission] === true
            );
          }

          // Check if user has any permission for this property
          const permission = await db.query.userPermissions.findFirst({
            where: and(
              eq(userPermissions.userId, authReq.user.id),
              eq(userPermissions.propertyId, propertyId)
            ),
          });

          return Boolean(permission);
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
 * Helper function to map permission types to database fields
 */
function getPermissionField(permissionType: string): string | null {
  const permissionMap: Record<string, string> = {
    manageTenants: "canManageTenants",
    manageLeases: "canManageLeases",
    collectPayments: "canCollectPayments",
    viewFinancials: "canViewFinancials",
    manageMaintenance: "canManageMaintenance",
    manageProperties: "canManageProperties",
  };

  return permissionMap[permissionType] || null;
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
 * Middleware to require specific roles
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = authReq.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Middleware to require property access
 */
export function requirePropertyPermission(permissionType?: string) {
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

    // Admin always has access
    if (authReq.user.role === "ADMIN") {
      return next();
    }

    // Check property permissions
    if (authReq.hasPropertyPermission) {
      const hasPermission = await authReq.hasPropertyPermission(
        propertyId,
        permissionType
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: permissionType
            ? `You don't have ${permissionType} permission for this property`
            : "You don't have access to this property",
        });
      }

      next();
    } else {
      // Fallback if helper isn't available
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
}

/**
 * Middleware to require property ownership
 */
export function requirePropertyOwnership() {
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

    // Admin always has access
    if (authReq.user.role === "ADMIN") {
      return next();
    }

    // Check property ownership
    if (authReq.isPropertyOwner) {
      const isOwner = await authReq.isPropertyOwner(propertyId);

      if (!isOwner) {
        return res.status(403).json({
          error: "Only the property owner can perform this action",
        });
      }

      next();
    } else {
      // Fallback if helper isn't available
      return res.status(500).json({ error: "Ownership check failed" });
    }
  };
}
