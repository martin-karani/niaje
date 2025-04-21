import {
  organizationEntity,
  teamEntity,
} from "@/domains/organizations/entities";
import { teamsService } from "@/domains/organizations/services";
import { db } from "@/infrastructure/database";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { auth } from "./better-auth/auth";

/**
 * Middleware to extract user session, organization, and permissions
 */
export function createAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get session from auth headers
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (session) {
        // Attach user to request
        req.user = session.user;

        // Get active organization if available
        if (session.activeOrganizationId) {
          const activeOrg = await db.query.organizationEntity.findFirst({
            where: eq(organizationEntity.id, session.activeOrganizationId),
          });

          if (activeOrg) {
            req.activeOrganization = activeOrg;
          }
        }

        // Get user's active team if available
        if (req.activeOrganization && session.activeTeamId) {
          const activeTeam = await db.query.teamEntity.findFirst({
            where: eq(teamEntity.id, session.activeTeamId),
          });

          if (activeTeam) {
            req.activeTeam = activeTeam;
          }
        }

        // Determine permissions
        req.permissions = await determinePermissions(
          session.user,
          req.activeOrganization,
          req.activeTeam
        );
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(); // Continue even on error to allow routes to handle auth requirements
    }
  };
}

/**
 * Determine user permissions based on their role, organization, and team
 */
export async function determinePermissions(
  user: any,
  organization: any,
  team: any
): Promise<Record<string, boolean>> {
  if (!user) {
    return {}; // No permissions for unauthenticated users
  }

  // Admin users get all permissions
  if (user.role === "admin") {
    return {
      canViewProperties: true,
      canManageProperties: true,
      canDeleteProperties: true,
      canViewTenants: true,
      canManageTenants: true,
      canViewLeases: true,
      canManageLeases: true,
      canViewMaintenance: true,
      canManageMaintenance: true,
      canManageUsers: true,
      canManageSubscription: true,
      canViewFinancial: true,
      canManageFinancial: true,
      canViewDocuments: true,
      canManageDocuments: true,
      canViewReports: true,
      canManageTeams: true,
      canInviteUsers: true,
    };
  }

  // If no organization, limited permissions
  if (!organization) {
    return {
      canViewProperties: false,
      canManageProperties: false,
      canDeleteProperties: false,
      canViewTenants: false,
      canManageTenants: false,
      canViewLeases: false,
      canManageLeases: false,
      canViewMaintenance: false,
      canManageMaintenance: false,
      canManageUsers: false,
      canManageSubscription: false,
      canViewFinancial: false,
      canManageFinancial: false,
      canViewDocuments: false,
      canManageDocuments: false,
      canViewReports: false,
      canManageTeams: false,
      canInviteUsers: false,
    };
  }

  // For organization owners
  if (user.role === "agent_owner" && organization.agentOwnerId === user.id) {
    return {
      canViewProperties: true,
      canManageProperties: true,
      canDeleteProperties: true,
      canViewTenants: true,
      canManageTenants: true,
      canViewLeases: true,
      canManageLeases: true,
      canViewMaintenance: true,
      canManageMaintenance: true,
      canManageUsers: true,
      canManageSubscription: true,
      canViewFinancial: true,
      canManageFinancial: true,
      canViewDocuments: true,
      canManageDocuments: true,
      canViewReports: true,
      canManageTeams: true,
      canInviteUsers: true,
    };
  }

  // For agent staff
  if (user.role === "agent_staff") {
    return {
      canViewProperties: true,
      canManageProperties: true,
      canDeleteProperties: false,
      canViewTenants: true,
      canManageTenants: true,
      canViewLeases: true,
      canManageLeases: true,
      canViewMaintenance: true,
      canManageMaintenance: true,
      canManageUsers: false,
      canManageSubscription: false,
      canViewFinancial: true,
      canManageFinancial: false,
      canViewDocuments: true,
      canManageDocuments: true,
      canViewReports: true,
      canManageTeams: false,
      canInviteUsers: true,
    };
  }

  // For property owners (can only view their own properties)
  if (user.role === "property_owner") {
    return {
      canViewProperties: true,
      canManageProperties: false,
      canDeleteProperties: false,
      canViewTenants: true,
      canManageTenants: false,
      canViewLeases: true,
      canManageLeases: false,
      canViewMaintenance: true,
      canManageMaintenance: false,
      canManageUsers: false,
      canManageSubscription: false,
      canViewFinancial: true,
      canManageFinancial: false,
      canViewDocuments: true,
      canManageDocuments: false,
      canViewReports: true,
      canManageTeams: false,
      canInviteUsers: false,
    };
  }

  // For caretakers (focused on maintenance)
  if (user.role === "caretaker") {
    return {
      canViewProperties: true,
      canManageProperties: false,
      canDeleteProperties: false,
      canViewTenants: true,
      canManageTenants: false,
      canViewLeases: true,
      canManageLeases: false,
      canViewMaintenance: true,
      canManageMaintenance: true,
      canManageUsers: false,
      canManageSubscription: false,
      canViewFinancial: false,
      canManageFinancial: false,
      canViewDocuments: true,
      canManageDocuments: false,
      canViewReports: false,
      canManageTeams: false,
      canInviteUsers: false,
    };
  }

  // For tenant users (very limited access)
  if (user.role === "tenant_user") {
    return {
      canViewProperties: false,
      canManageProperties: false,
      canDeleteProperties: false,
      canViewTenants: false,
      canManageTenants: false,
      canViewLeases: true,
      canManageLeases: false,
      canViewMaintenance: true,
      canManageMaintenance: false,
      canManageUsers: false,
      canManageSubscription: false,
      canViewFinancial: false,
      canManageFinancial: false,
      canViewDocuments: true,
      canManageDocuments: false,
      canViewReports: false,
      canManageTeams: false,
      canInviteUsers: false,
    };
  }

  // Default permissions (minimal access)
  return {
    canViewProperties: false,
    canManageProperties: false,
    canDeleteProperties: false,
    canViewTenants: false,
    canManageTenants: false,
    canViewLeases: false,
    canManageLeases: false,
    canViewMaintenance: false,
    canManageMaintenance: false,
    canManageUsers: false,
    canManageSubscription: false,
    canViewFinancial: false,
    canManageFinancial: false,
    canViewDocuments: false,
    canManageDocuments: false,
    canViewReports: false,
    canManageTeams: false,
    canInviteUsers: false,
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
 * Middleware to require specific permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!req.permissions || !req.permissions[permission]) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to perform this action",
      });
    }

    next();
  };
}

/**
 * Middleware to check property access for a team
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
