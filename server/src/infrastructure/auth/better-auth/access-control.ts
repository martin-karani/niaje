/**
 * Access Control class to handle permission checks
 * This builds on top of Better-Auth's permission system with additional context
 * for property management specific logic
 */
export class AC {
  private user: any;
  private organization: any;
  private team: any;

  constructor(user: any, organization: any, team: any) {
    this.user = user;
    this.organization = organization;
    this.team = team;
  }

  /**
   * Check if user has permission to perform an action on a resource
   */
  can(resource: string, action: string | string[]): boolean {
    // If no user or no organization, deny access
    if (!this.user || !this.organization) {
      return false;
    }

    // For array of actions, check if user can perform any of them
    if (Array.isArray(action)) {
      return action.some((a) => this.can(resource, a));
    }

    // Admin users can do everything
    if (this.user.role === "admin") {
      return true;
    }

    // Organization owners can do everything within their organization
    if (
      this.user.role === "agent_owner" &&
      this.organization.agentOwnerId === this.user.id
    ) {
      return true;
    }

    // Get role-based permissions
    const rolePermissions = this.getRolePermissions(this.user.role);

    // Check team-specific permissions (if user is in a team)
    if (this.team) {
      const teamPermissions = this.getTeamPermissions(this.team.id);

      // Team permissions override role permissions if defined
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

  /**
   * Get permissions for a specific role
   */
  private getRolePermissions(
    role: string
  ): Record<string, Record<string, boolean>> {
    // Define permissions for all roles
    const roleMap: Record<string, Record<string, Record<string, boolean>>> = {
      admin: {
        // Admin has access to everything
        property: {
          view: true,
          create: true,
          update: true,
          delete: true,
          assign_caretaker: true,
        },
        unit: { view: true, create: true, update: true, delete: true },
        tenant: {
          view: true,
          create: true,
          update: true,
          delete: true,
          contact: true,
        },
        lease: {
          view: true,
          create: true,
          update: true,
          terminate: true,
          renew: true,
        },
        payment: { view: true, record: true, process: true, approve: true },
        expense: { view: true, create: true, update: true, delete: true },
        maintenance: {
          view: true,
          create: true,
          update: true,
          resolve: true,
          assign: true,
        },
        document: { view: true, upload: true, delete: true },
        organization: {
          view: true,
          update: true,
          delete: true,
          manage_subscription: true,
        },
        member: { invite: true, remove: true, update_role: true },
        team: {
          create: true,
          update: true,
          delete: true,
          assign_properties: true,
        },
      },

      agent_owner: {
        // Agent owners have full access within their organization
        property: {
          view: true,
          create: true,
          update: true,
          delete: true,
          assign_caretaker: true,
        },
        unit: { view: true, create: true, update: true, delete: true },
        tenant: {
          view: true,
          create: true,
          update: true,
          delete: true,
          contact: true,
        },
        lease: {
          view: true,
          create: true,
          update: true,
          terminate: true,
          renew: true,
        },
        payment: { view: true, record: true, process: true, approve: true },
        expense: { view: true, create: true, update: true, delete: true },
        maintenance: {
          view: true,
          create: true,
          update: true,
          resolve: true,
          assign: true,
        },
        document: { view: true, upload: true, delete: true },
        organization: {
          view: true,
          update: true,
          delete: true,
          manage_subscription: true,
        },
        member: { invite: true, remove: true, update_role: true },
        team: {
          create: true,
          update: true,
          delete: true,
          assign_properties: true,
        },
      },

      agent_staff: {
        // Regular staff with limited permissions
        property: {
          view: true,
          create: true,
          update: true,
          delete: false,
          assign_caretaker: false,
        },
        unit: { view: true, create: true, update: true, delete: false },
        tenant: {
          view: true,
          create: true,
          update: true,
          delete: false,
          contact: true,
        },
        lease: {
          view: true,
          create: true,
          update: true,
          terminate: false,
          renew: true,
        },
        payment: { view: true, record: true, process: false, approve: false },
        expense: { view: true, create: true, update: true, delete: false },
        maintenance: {
          view: true,
          create: true,
          update: true,
          resolve: true,
          assign: true,
        },
        document: { view: true, upload: true, delete: false },
        organization: {
          view: true,
          update: false,
          delete: false,
          manage_subscription: false,
        },
        member: { invite: false, remove: false, update_role: false },
        team: {
          create: false,
          update: false,
          delete: false,
          assign_properties: false,
        },
      },

      property_owner: {
        // Property owners can view their own properties and related data
        property: {
          view: true,
          create: false,
          update: false,
          delete: false,
          assign_caretaker: false,
        },
        unit: { view: true, create: false, update: false, delete: false },
        tenant: {
          view: true,
          create: false,
          update: false,
          delete: false,
          contact: false,
        },
        lease: {
          view: true,
          create: false,
          update: false,
          terminate: false,
          renew: false,
        },
        payment: { view: true, record: false, process: false, approve: false },
        expense: { view: true, create: false, update: false, delete: false },
        maintenance: {
          view: true,
          create: true,
          update: false,
          resolve: false,
          assign: false,
        },
        document: { view: true, upload: false, delete: false },
        organization: {
          view: false,
          update: false,
          delete: false,
          manage_subscription: false,
        },
        member: { invite: false, remove: false, update_role: false },
        team: {
          view: false,
          create: false,
          update: false,
          delete: false,
          assign_properties: false,
        },
      },

      caretaker: {
        // Caretakers focus on maintenance and tenant communication
        property: {
          view: true,
          create: false,
          update: false,
          delete: false,
          assign_caretaker: false,
        },
        unit: { view: true, create: false, update: false, delete: false },
        tenant: {
          view: true,
          create: false,
          update: false,
          delete: false,
          contact: true,
        },
        lease: {
          view: true,
          create: false,
          update: false,
          terminate: false,
          renew: false,
        },
        payment: { view: false, record: false, process: false, approve: false },
        expense: { view: false, create: false, update: false, delete: false },
        maintenance: {
          view: true,
          create: true,
          update: true,
          resolve: true,
          assign: false,
        },
        document: { view: true, upload: false, delete: false },
        organization: {
          view: false,
          update: false,
          delete: false,
          manage_subscription: false,
        },
        member: { invite: false, remove: false, update_role: false },
        team: {
          view: false,
          create: false,
          update: false,
          delete: false,
          assign_properties: false,
        },
      },

      tenant_user: {
        // Tenant portal user permissions
        property: {
          view: false,
          create: false,
          update: false,
          delete: false,
          assign_caretaker: false,
        },
        unit: { view: false, create: false, update: false, delete: false },
        tenant: {
          view: false,
          create: false,
          update: false,
          delete: false,
          contact: false,
        },
        lease: {
          view: true,
          create: false,
          update: false,
          terminate: false,
          renew: false,
        },
        payment: { view: true, record: true, process: false, approve: false },
        expense: { view: false, create: false, update: false, delete: false },
        maintenance: {
          view: true,
          create: true,
          update: false,
          resolve: false,
          assign: false,
        },
        document: { view: true, upload: false, delete: false },
        organization: {
          view: false,
          update: false,
          delete: false,
          manage_subscription: false,
        },
        member: { invite: false, remove: false, update_role: false },
        team: {
          view: false,
          create: false,
          update: false,
          delete: false,
          assign_properties: false,
        },
      },
    };

    return roleMap[role] || {};
  }

  /**
   * Get team-specific permissions
   * This would typically be fetched from the database in a real implementation
   */
  private getTeamPermissions(
    teamId: string
  ): Record<string, Record<string, boolean>> {
    // In a real implementation, fetch team permissions from database
    // For now, returning an empty object as a placeholder

    // TODO: Implement proper team permissions fetching from database
    return {};
  }
}
