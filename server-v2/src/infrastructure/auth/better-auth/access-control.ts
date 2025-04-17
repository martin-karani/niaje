// src/infrastructure/auth/better-auth/access-control.ts
export class AC {
  private user: any;
  private organization: any;
  private team: any;

  constructor(user: any, organization: any, team: any) {
    this.user = user;
    this.organization = organization;
    this.team = team;
  }

  can(resource: string, action: string | string[]): boolean {
    // If no user or no organization, deny access
    if (!this.user || !this.organization) {
      return false;
    }

    // For array of actions, check if user can perform any of them
    if (Array.isArray(action)) {
      return action.some((a) => this.can(resource, a));
    }

    // Get user role permissions from better-auth AC system
    const rolePermissions = this.getRolePermissions(this.user.role);

    // Check team-specific permissions
    if (this.team) {
      const teamPermissions = this.getTeamPermissions(this.team.id);
      // Team permissions override role permissions
      if (
        teamPermissions[resource] &&
        teamPermissions[resource][action] !== undefined
      ) {
        return teamPermissions[resource][action];
      }
    }

    // Check role permissions
    if (
      rolePermissions[resource] &&
      rolePermissions[resource][action] !== undefined
    ) {
      return rolePermissions[resource][action];
    }

    return false;
  }

  private getRolePermissions(
    role: string
  ): Record<string, Record<string, boolean>> {
    // Define permissions for all roles
    const roleMap: Record<string, Record<string, Record<string, boolean>>> = {
      admin: {
        // Admin has access to everything
        property: { view: true, create: true, update: true, delete: true },
        tenant: {
          view: true,
          create: true,
          update: true,
          manage: true,
          approve: true,
          remove: true,
        },
        lease: { view: true, create: true, update: true },
        maintenance: { view: true, manage: true },
        staff: { assign: true, remove: true, view: true },
        financial: {
          view: true,
          manage: true,
          record: true,
          invoice: true,
          view_limited: true,
        },
      },
      agent_owner: {
        // Agent owner can do everything within their organization
        property: { view: true, create: true, update: true, delete: true },
        tenant: {
          view: true,
          create: true,
          update: true,
          manage: true,
          approve: true,
          remove: true,
        },
        lease: { view: true, create: true, update: true },
        maintenance: { view: true, manage: true },
        staff: { assign: true, remove: true, view: true },
        financial: {
          view: true,
          manage: true,
          record: true,
          invoice: true,
          view_limited: true,
        },
      },
      agent_staff: {
        // Regular staff with limited permissions
        property: { view: true, create: true, update: true, delete: false },
        tenant: {
          view: true,
          create: true,
          update: true,
          manage: true,
          approve: true,
          remove: false,
        },
        lease: { view: true, create: true, update: true },
        maintenance: { view: true, manage: true },
        staff: { assign: false, remove: false, view: true },
        financial: {
          view: false,
          manage: false,
          record: true,
          invoice: true,
          view_limited: true,
        },
      },
      property_owner: {
        // Landlord permissions (view-only for most things)
        property: { view: true, create: false, update: false, delete: false },
        tenant: {
          view: true,
          create: false,
          update: false,
          manage: false,
          approve: false,
          remove: false,
        },
        lease: { view: true, create: false, update: false },
        maintenance: { view: true, manage: false },
        staff: { assign: false, remove: false, view: false },
        financial: {
          view: true,
          manage: false,
          record: false,
          invoice: false,
          view_limited: false,
        },
      },
      caretaker: {
        // Caretaker permissions (focused on maintenance and tenant management)
        property: { view: true, create: false, update: false, delete: false },
        tenant: {
          view: true,
          create: false,
          update: false,
          manage: true,
          approve: false,
          remove: false,
        },
        lease: { view: true, create: false, update: false },
        maintenance: { view: true, manage: true },
        staff: { assign: false, remove: false, view: false },
        financial: {
          view: false,
          manage: false,
          record: true,
          invoice: false,
          view_limited: true,
        },
      },
      tenant_user: {
        // Tenant portal user permissions
        property: { view: false, create: false, update: false, delete: false },
        tenant: {
          view: false,
          create: false,
          update: false,
          manage: false,
          approve: false,
          remove: false,
        },
        lease: { view: true, create: false, update: false },
        maintenance: { view: true, manage: true }, // Can create and view their own maintenance requests
        staff: { assign: false, remove: false, view: false },
        financial: {
          view: false,
          manage: false,
          record: false,
          invoice: false,
          view_limited: true,
        },
      },
    };

    return roleMap[role] || {};
  }

  private getTeamPermissions(
    teamId: string
  ): Record<string, Record<string, boolean>> {
    // In a real implementation, fetch team-specific permissions from database
    // This would load team permissions from the database based on teamId
    // For now, we're returning an empty object as a placeholder

    // TODO: Implement proper team permissions fetching
    return {};
  }
}
