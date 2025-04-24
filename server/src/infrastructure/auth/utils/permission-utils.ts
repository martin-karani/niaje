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
  permission: string, // A consistent permission string like "viewFinancial", "manageLeases", etc.
  resourceType?: string, // Optional resource type for more granular checks
  action?: string, // Optional action for more granular checks
  resourceId?: string // Optional specific resource ID
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

  // If resourceType and action are provided, use permissionChecker with them
  if (resourceType && action) {
    await permissionChecker.assertCan(resourceType, action, resourceId);
  } else {
    // Otherwise use a direct permission check based on the permission string
    // This maps common permission strings to resource types and actions
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

    // Get the resource type and action from the permission map
    const permissionConfig = permissionMap[permission];
    if (!permissionConfig) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    // Check the permission using the permission checker
    await permissionChecker.assertCan(
      permissionConfig.resourceType,
      permissionConfig.action,
      resourceId
    );
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

  // Map permission level to action
  const action =
    permissionLevel === "view"
      ? "view"
      : permissionLevel === "manage"
        ? "update"
        : "delete";

  // Check if user has permission for this property
  await permissionChecker.assertCan("property", action, propertyId);

  return { organizationId: organization.id };
}

/**
 * A set of standardized domain-specific permission checks
 * These provide clearer semantics for common permission checks
 */

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

// Document permissions
export async function checkDocumentPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): Promise<{ organizationId: string; userId: string }> {
  return checkPermissions(
    context,
    permission === "view" ? "viewDocuments" : "manageDocuments"
  );
}

// Inspection permissions
export async function checkInspectionPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): Promise<{ organizationId: string; userId: string }> {
  return checkPermissions(
    context,
    permission === "view" ? "viewInspections" : "manageInspections"
  );
}
