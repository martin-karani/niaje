import { AC } from "@infrastructure/auth/better-auth/access-control";

export function determinePermissions(
  user: any,
  organization: any,
  team: any
): Record<string, boolean> {
  if (!user) {
    return getDefaultPermissions(false);
  }

  if (user.role === "admin") {
    return getDefaultPermissions(true);
  }

  if (
    organization &&
    user.role === "agent_owner" &&
    organization.agentOwnerId === user.id
  ) {
    return {
      ...getDefaultPermissions(false),
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
    };
  }

  if (organization && user.role === "agent_staff") {
    const ac = new AC(user, organization, team);

    return {
      canViewProperties: ac.can("property", "view"),
      canManageProperties: ac.can("property", ["create", "update"]),
      canDeleteProperties: ac.can("property", "delete"),
      canViewTenants: ac.can("tenant", "view"),
      canManageTenants: ac.can("tenant", ["create", "update"]),
      canViewLeases: ac.can("lease", "view"),
      canManageLeases: ac.can("lease", ["create", "update"]),
      canViewMaintenance: ac.can("maintenance", "view"),
      canManageMaintenance: ac.can("maintenance", "manage"),
      canManageUsers: ac.can("staff", ["assign", "remove"]),
      canManageSubscription: false,
    };
  }

  if (user.role === "property_owner") {
    return {
      ...getDefaultPermissions(false),
      canViewProperties: true,
      canViewTenants: true,
      canViewLeases: true,
      canViewMaintenance: true,
    };
  }

  if (user.role === "tenant_user") {
    return {
      ...getDefaultPermissions(false),
      canViewMaintenance: true,
      canManageMaintenance: true,
    };
  }

  return getDefaultPermissions(false);
}

function getDefaultPermissions(isAdmin: boolean): Record<string, boolean> {
  return {
    canViewProperties: isAdmin,
    canManageProperties: isAdmin,
    canDeleteProperties: isAdmin,
    canViewTenants: isAdmin,
    canManageTenants: isAdmin,
    canViewLeases: isAdmin,
    canManageLeases: isAdmin,
    canViewMaintenance: isAdmin,
    canManageMaintenance: isAdmin,
    canManageUsers: isAdmin,
    canManageSubscription: isAdmin,
  };
}
