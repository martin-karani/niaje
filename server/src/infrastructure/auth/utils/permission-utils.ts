import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors";

/**
 * Check if user has permission to access a resource
 * Returns organization ID and user ID if allowed
 * Throws AuthorizationError if not allowed
 */
export async function checkPermissions(
  context: GraphQLContext,
  resourceType: string,
  action: string,
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

  // Check permission
  await permissionChecker.assertCan(resourceType, action, resourceId);

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
 * Specialized permission checks for different domains
 */

export function checkFinancialPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  return checkDomainPermission(context, "financial", permission);
}

export function checkTenantsPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  return checkDomainPermission(context, "tenant", permission);
}

export function checkLeasesPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  return checkDomainPermission(context, "lease", permission);
}

export function checkMaintenancePermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  return checkDomainPermission(context, "maintenance", permission);
}

export function checkDocumentsPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  return checkDomainPermission(context, "document", permission);
}

/**
 * Helper for domain-specific permission checks
 */
function checkDomainPermission(
  context: GraphQLContext,
  domain: string,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  const { user, organization, permissionChecker } = context;

  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  if (!organization) {
    throw new AuthorizationError("No active organization selected");
  }

  // Map view/manage to specific actions
  const action = permission === "view" ? "view" : "update";

  // Check sync - for simplicity we're not using await here, as this is a quick check
  // In a real implementation you might want to make this async for database checks
  const allowed = permissionChecker.can(domain, action);

  if (!allowed) {
    throw new AuthorizationError(
      `You don't have permission to ${permission} ${domain}s`
    );
  }

  return { organizationId: organization.id };
}
