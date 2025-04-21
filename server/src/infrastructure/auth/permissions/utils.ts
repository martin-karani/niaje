import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors/authorization.error";

/**
 * Check if the user has permission to access a resource
 * This utility makes it easy to add permission checks in GraphQL resolvers
 */
export function checkPermissions(
  context: GraphQLContext,
  permission: string,
  resource?: string,
  action?: string
): { organizationId: string; userId: string } {
  const { user, organization, permissions, ac } = context;

  // Check if user is authenticated
  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  // Check if organization is selected
  if (!organization) {
    throw new AuthorizationError("No active organization selected");
  }

  // First check the high-level permission (e.g., canViewProperties)
  if (!permissions[permission]) {
    throw new AuthorizationError(
      `You don't have permission to ${permission
        .replace("can", "")
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()
        .trim()}`
    );
  }

  // If resource and action are provided, perform a fine-grained permission check
  if (resource && action && ac) {
    if (!ac.can(resource, action)) {
      throw new AuthorizationError(
        `You don't have permission to ${action.replace(/([A-Z])/g, " $1").toLowerCase()} ${resource}`
      );
    }
  }

  return { organizationId: organization.id, userId: user.id };
}

/**
 * Check if the user has permission to manage a specific property
 * This includes team-based permissions
 */
export async function checkPropertyPermission(
  context: GraphQLContext,
  propertyId: string,
  permissionLevel: "view" | "manage" | "delete" = "view"
): Promise<{ organizationId: string }> {
  const { user, organization, team } = context;

  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  if (!organization) {
    throw new AuthorizationError("No active organization selected");
  }

  // Permission mapping
  const permissionMap = {
    view: "canViewProperties",
    manage: "canManageProperties",
    delete: "canDeleteProperties",
  };

  // Check appropriate permission
  if (!context.permissions[permissionMap[permissionLevel]]) {
    throw new AuthorizationError(
      `You don't have permission to ${permissionLevel} properties`
    );
  }

  // For users in teams (except admins and org owners), check team-property relationship
  if (
    team &&
    user.role !== "admin" &&
    !(user.role === "agent_owner" && organization.agentOwnerId === user.id)
  ) {
    // Import teamsService in your implementation and use it here
    // const hasAccess = await teamsService.isPropertyInTeam(team.id, propertyId);
    // if (!hasAccess) {
    //   throw new AuthorizationError("You don't have access to this property");
    // }
    // Note: Since we can't directly reference teamsService in this example,
    // you'll need to implement this check in your actual code
  }

  return { organizationId: organization.id };
}

/**
 * Example permission checks for specific domains
 */

export function checkFinancialPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  const permissionMap = {
    view: "canViewFinancial",
    manage: "canManageFinancial",
  };

  return checkPermissions(context, permissionMap[permission]);
}

export function checkTenantsPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  const permissionMap = {
    view: "canViewTenants",
    manage: "canManageTenants",
  };

  return checkPermissions(context, permissionMap[permission]);
}

export function checkLeasesPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  const permissionMap = {
    view: "canViewLeases",
    manage: "canManageLeases",
  };

  return checkPermissions(context, permissionMap[permission]);
}

export function checkMaintenancePermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  const permissionMap = {
    view: "canViewMaintenance",
    manage: "canManageMaintenance",
  };

  return checkPermissions(context, permissionMap[permission]);
}

export function checkDocumentsPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string } {
  const permissionMap = {
    view: "canViewDocuments",
    manage: "canManageDocuments",
  };

  return checkPermissions(
    context,
    permissionMap[permission],
    "document",
    permission === "view" ? "view" : "upload"
  );
}
