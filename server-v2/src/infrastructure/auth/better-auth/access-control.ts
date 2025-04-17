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
    // This would normally come from your better-auth AC system
    const roleMap: Record<string, Record<string, Record<string, boolean>>> = {
      agent_staff: {
        property: { view: true, create: true, update: true, delete: false },
        tenant: { view: true, create: true, update: true, manage: true },
        lease: { view: true, create: true, update: true },
        maintenance: { view: true, manage: true },
        staff: { assign: false, remove: false, view: true },
      },
      caretaker: {
        property: { view: true, create: false, update: false, delete: false },
        tenant: { view: true, create: false, update: false, manage: true },
        lease: { view: true, create: false, update: false },
        maintenance: { view: true, manage: true },
        staff: { assign: false, remove: false, view: false },
      },
    };

    return roleMap[role] || {};
  }

  private getTeamPermissions(
    teamId: string
  ): Record<string, Record<string, boolean>> {
    // In a real implementation, this would fetch team-specific permissions
    // For now, return an empty object
    return {};
  }
}
