import {
  memberEntity,
  teamPropertyEntity,
} from "@/domains/organizations/entities";
import { db } from "@/infrastructure/database";
import { AuthorizationError } from "@/shared/errors";
import { and, eq } from "drizzle-orm";
import { DEFAULT_ROLE_PERMISSIONS } from "./services/permission.service";

/**
 * Permission Checker class
 * Provides methods to check if a user has permission to perform actions
 */
export class PermissionChecker {
  private user: any;
  private organization: any;
  private team: any;
  private memberRole: string | null = null;
  private cachedChecks: Record<string, boolean> = {};

  constructor(user: any, organization: any, team: any) {
    this.user = user;
    this.organization = organization;
    this.team = team;
  }

  /**
   * Check if user can perform an action on a resource type
   */
  async can(
    resourceType: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    // Build cache key
    const cacheKey = `${resourceType}:${action}:${resourceId || ""}`;

    // Check cache first
    if (this.cachedChecks[cacheKey] !== undefined) {
      return this.cachedChecks[cacheKey];
    }

    // No user or organization means no permission
    if (!this.user || !this.organization) {
      this.cachedChecks[cacheKey] = false;
      return false;
    }

    // Organization owners can do everything in their organization
    if (this.organization.agentOwnerId === this.user.id) {
      this.cachedChecks[cacheKey] = true;
      return true;
    }

    // Get member role if not already cached
    if (!this.memberRole) {
      // Fetch member role from database
      const member = await db.query.memberEntity.findFirst({
        where: and(
          eq(memberEntity.userId, this.user.id),
          eq(memberEntity.organizationId, this.organization.id)
        ),
      });

      this.memberRole = member?.role || null;
    }

    // Organization admins can do everything in their organization
    if (this.memberRole === "admin" || this.memberRole === "owner") {
      this.cachedChecks[cacheKey] = true;
      return true;
    }

    // Check role-based permissions
    const rolePermissions =
      DEFAULT_ROLE_PERMISSIONS[this.memberRole || ""] || {};
    const resourcePermissions = rolePermissions[resourceType] || [];

    if (!resourcePermissions.includes(action)) {
      this.cachedChecks[cacheKey] = false;
      return false;
    }

    // If no specific resource ID, role-based permission is sufficient
    if (!resourceId) {
      this.cachedChecks[cacheKey] = true;
      return true;
    }

    // For property resources, check team-based access if user is in a team
    if (resourceType === "property" && this.team) {
      const hasAccess = await this.checkTeamPropertyAccess(resourceId);
      this.cachedChecks[cacheKey] = hasAccess;
      return hasAccess;
    }

    // Default to role-based permission
    this.cachedChecks[cacheKey] = true;
    return true;
  }

  /**
   * Check if user's team has access to a property
   */
  private async checkTeamPropertyAccess(propertyId: string): Promise<boolean> {
    if (!this.team) {
      return true; // No team restriction
    }

    const teamProperty = await db.query.teamPropertyEntity.findFirst({
      where: and(
        eq(teamPropertyEntity.teamId, this.team.id),
        eq(teamPropertyEntity.propertyId, propertyId)
      ),
    });

    return !!teamProperty;
  }

  /**
   * Assert that user can perform an action on a resource
   * Throws AuthorizationError if not permitted
   */
  async assertCan(
    resourceType: string,
    action: string,
    resourceId?: string
  ): Promise<void> {
    const allowed = await this.can(resourceType, action, resourceId);

    if (!allowed) {
      throw new AuthorizationError(
        `You don't have permission to ${action} this ${resourceType}`
      );
    }
  }

  /**
   * Get all properties user can access
   */
  async getAccessiblePropertyIds(): Promise<string[]> {
    // Admin and owner have access to all properties
    if (
      this.memberRole === "admin" ||
      this.memberRole === "owner" ||
      this.organization.agentOwnerId === this.user.id
    ) {
      // Return all org properties (would fetch from DB in real implementation)
      return []; // Placeholder, would need to fetch all property IDs
    }

    // For team members, get team properties
    if (this.team) {
      const teamProperties = await db.query.teamPropertyEntity.findMany({
        where: eq(teamPropertyEntity.teamId, this.team.id),
      });

      return teamProperties.map((tp) => tp.propertyId);
    }

    // By default return empty array (would implement specific logic for other roles)
    return [];
  }
}
