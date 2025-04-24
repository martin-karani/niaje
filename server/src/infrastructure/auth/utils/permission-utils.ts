// src/infrastructure/auth/utils/permission-utils.ts

import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors";

/**
 * Standardized method to check if user has permission to access a resource
 * Returns organization ID and user ID if allowed
 * Throws AuthorizationError if not allowed
 */
export async function checkPermissions(
  context: GraphQLContext,
  permission: string,
  resourceType?: string,
  action?: string,
  resourceId?: string
): Promise<{ organizationId: string; userId: string }> {
  const { user, organization, permissionChecker } = context;

  // Check if user is authenticated
  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  // Check if organization is selected
  if (!organization) {
    throw new AuthorizationError("No active organization selected");
  }

  // Check if permission checker exists
  if (!permissionChecker) {
    throw new AuthorizationError("Permission checker not initialized");
  }

  // If resourceType and action are provided, use them directly
  if (resourceType && action) {
    const allowed = await permissionChecker.can(
      resourceType,
      action,
      resourceId
    );
    if (!allowed) {
      throw new AuthorizationError(
        `You don't have permission to ${action} this ${resourceType}`
      );
    }
  } else {
    // Otherwise map the permission string to resource type and action
    const permissionMap: Record<
      string,
      { resourceType: string; action: string }
    > = {
      // Financial permissions
      viewFinancial: { resourceType: "financial", action: "view" },
      manageFinancial: { resourceType: "financial", action: "manage" },

      // Property permissions
      viewProperties: { resourceType: "property", action: "view" },
      manageProperties: { resourceType: "property", action: "manage" },
      deleteProperties: { resourceType: "property", action: "delete" },

      // Tenant permissions
      viewTenants: { resourceType: "tenant", action: "view" },
      manageTenants: { resourceType: "tenant", action: "manage" },

      // Lease permissions
      viewLeases: { resourceType: "lease", action: "view" },
      manageLeases: { resourceType: "lease", action: "manage" },

      // Maintenance permissions
      viewMaintenance: { resourceType: "maintenance", action: "view" },
      manageMaintenance: { resourceType: "maintenance", action: "manage" },

      // Inspection permissions
      viewInspections: { resourceType: "inspection", action: "view" },
      manageInspections: { resourceType: "inspection", action: "manage" },

      // Document permissions
      viewDocuments: { resourceType: "document", action: "view" },
      manageDocuments: { resourceType: "document", action: "manage" },

      // Organization permissions
      viewOrganization: { resourceType: "organization", action: "view" },
      manageOrganization: { resourceType: "organization", action: "manage" },

      // Team permissions
      viewTeams: { resourceType: "team", action: "view" },
      manageTeams: { resourceType: "team", action: "manage" },
    };

    const permissionConfig = permissionMap[permission];
    if (!permissionConfig) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    const allowed = await permissionChecker.can(
      permissionConfig.resourceType,
      permissionConfig.action,
      resourceId
    );

    if (!allowed) {
      throw new AuthorizationError(
        `You don't have permission to ${permissionConfig.action} ${permissionConfig.resourceType}`
      );
    }
  }

  return { organizationId: organization.id, userId: user.id };
}

/**
 * Check property-specific permissions
 * This is used for checking access to a property or property-related resource
 */
export async function checkPropertyPermission(
  context: GraphQLContext,
  propertyId: string,
  permissionLevel: "view" | "manage" | "delete" = "view"
): Promise<{ organizationId: string }> {
  const { user, organization, permissionChecker } = context;

  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  if (!organization) {
    throw new AuthorizationError("No active organization selected");
  }

  if (!permissionChecker) {
    throw new AuthorizationError("Permission checker not initialized");
  }

  // Map permission level to action
  const action =
    permissionLevel === "view"
      ? "view"
      : permissionLevel === "manage"
        ? "update"
        : "delete";

  // Check if user has permission for this property
  const allowed = await permissionChecker.can("property", action, propertyId);
  if (!allowed) {
    throw new AuthorizationError(
      `You don't have permission to ${action} this property`
    );
  }

  return { organizationId: organization.id };
}

// Domain-specific permission check helpers

// Financial permissions
export async function checkFinancialPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): Promise<{ organizationId: string; userId: string }> {
  return checkPermissions(
    context,
    permission === "view" ? "viewFinancial" : "manageFinancial"
  );
}

// Tenant permissions
export async function checkTenantPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): Promise<{ organizationId: string; userId: string }> {
  return checkPermissions(
    context,
    permission === "view" ? "viewTenants" : "manageTenants"
  );
}

// Lease permissions
export async function checkLeasePermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): Promise<{ organizationId: string; userId: string }> {
  return checkPermissions(
    context,
    permission === "view" ? "viewLeases" : "manageLeases"
  );
}

// Maintenance permissions
export async function checkMaintenancePermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): Promise<{ organizationId: string; userId: string }> {
  return checkPermissions(
    context,
    permission === "view" ? "viewMaintenance" : "manageMaintenance"
  );
}
