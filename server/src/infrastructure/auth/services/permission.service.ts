import { leaseEntity } from "@/domains/leases/entities";
import { maintenanceRequestsEntity } from "@/domains/maintenance/entities";
import { memberEntity, teamEntity } from "@/domains/organizations/entities";
import { propertyEntity, unitEntity } from "@/domains/properties/entities";
import { leaseTenantsEntity, tenantEntity } from "@/domains/tenants/entities";
import { db } from "@/infrastructure/database";
import { and, eq } from "drizzle-orm";
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { teamService } from "./team.service";

// Schema for resource-level permissions
export const resourcePermissionEntity = pgTable(
  "resource_permissions",
  {
    teamId: text("team_id").references(() => teamEntity.id, {
      onDelete: "cascade",
    }),
    resourceType: text("resource_type").notNull(), // e.g., 'property', 'tenant', 'lease'
    resourceId: text("resource_id").notNull(),
    action: text("action").notNull(), // e.g., 'view', 'create', 'update', 'delete'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [
          table.teamId,
          table.resourceType,
          table.resourceId,
          table.action,
        ],
      }),
    };
  }
);

// Default permissions for different roles
export const DEFAULT_ROLE_PERMISSIONS: Record<
  string,
  Record<string, string[]>
> = {
  admin: {
    property: [
      "view",
      "create",
      "update",
      "delete",
      "assign_caretaker",
      "manage_utility",
    ],
    unit: ["view", "create", "update", "delete", "list", "assign"],
    tenant: ["view", "create", "update", "delete", "contact", "approve"],
    lease: ["view", "create", "update", "delete", "terminate", "renew"],
    payment: ["view", "record", "process", "approve"],
    expense: ["view", "create", "update", "delete"],
    maintenance: ["view", "create", "update", "resolve", "assign"],
    document: ["view", "upload", "delete"],
    report: ["view", "generate", "export"],
    team: ["view", "create", "update", "delete", "assign_members"],
    member: ["view", "invite", "update", "remove"],
    organization: ["view", "update", "delete"],
    billing: ["view", "update", "manage_subscription"],
  },

  agent_owner: {
    property: [
      "view",
      "create",
      "update",
      "delete",
      "assign_caretaker",
      "manage_utility",
    ],
    unit: ["view", "create", "update", "delete", "list", "assign"],
    tenant: ["view", "create", "update", "delete", "contact", "approve"],
    lease: ["view", "create", "update", "delete", "terminate", "renew"],
    payment: ["view", "record", "process", "approve"],
    expense: ["view", "create", "update", "delete"],
    maintenance: ["view", "create", "update", "resolve", "assign"],
    document: ["view", "upload", "delete"],
    report: ["view", "generate", "export"],
    team: ["view", "create", "update", "delete", "assign_members"],
    member: ["view", "invite", "update", "remove"],
    organization: ["view", "update", "delete"],
    billing: ["view", "update", "manage_subscription"],
  },

  agent_staff: {
    property: ["view", "create", "update", "manage_utility"],
    unit: ["view", "create", "update", "list"],
    tenant: ["view", "create", "update", "contact"],
    lease: ["view", "create", "update", "renew"],
    payment: ["view", "record"],
    expense: ["view", "create", "update"],
    maintenance: ["view", "create", "update", "resolve", "assign"],
    document: ["view", "upload"],
    report: ["view", "generate"],
    team: ["view"],
    member: ["view"],
    organization: ["view"],
    billing: ["view"],
  },

  property_owner: {
    property: ["view"],
    unit: ["view", "list"],
    tenant: ["view", "list"],
    lease: ["view", "list"],
    payment: ["view"],
    expense: ["view"],
    maintenance: ["view", "create"],
    document: ["view"],
    report: ["view"],
  },

  caretaker: {
    property: ["view"],
    unit: ["view", "list"],
    tenant: ["view", "contact"],
    lease: ["view"],
    maintenance: ["view", "create", "update", "resolve"],
    document: ["view"],
  },

  tenant_user: {
    lease: ["view"],
    payment: ["view", "record"],
    maintenance: ["view", "create"],
    document: ["view"],
  },
};

export class PermissionService {
  /**
   * Check if a user has permission to perform an action on a resource type
   */
  async hasPermission(data: {
    userId: string;
    organizationId: string;
    resourceType: string;
    action: string;
    resourceId?: string;
  }): Promise<boolean> {
    const { userId, organizationId, resourceType, action, resourceId } = data;

    // Get user's role and team in the organization
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
      with: {
        user: true,
      },
    });

    if (!member) {
      return false; // User is not a member of the organization
    }

    // Admin and owner roles have full permissions
    if (member.user.role === "admin" || member.role === "owner") {
      return true;
    }

    // Check role-based permissions
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[member.user.role];
    if (!rolePermissions) {
      return false; // Role not found
    }

    const resourcePermissions = rolePermissions[resourceType] || [];
    if (!resourcePermissions.includes(action)) {
      return false; // Role doesn't have permission for this action
    }

    // If no specific resource ID is provided, the role-based check is sufficient
    if (!resourceId) {
      return true;
    }

    // For property resources, check team-based access (if user is in a team)
    if (resourceType === "property" && member.teamId) {
      // Check if the team has access to this property
      return teamService.isPropertyInTeam(member.teamId, resourceId);
    }

    // For resources associated with a property, check team-based access
    if (
      ["unit", "tenant", "lease", "maintenance"].includes(resourceType) &&
      member.teamId
    ) {
      // Find the property associated with this resource
      let propertyId: string | null = null;

      switch (resourceType) {
        case "unit":
          const unit = await db.query.unitEntity.findFirst({
            where: eq(unitEntity.id, resourceId),
          });
          propertyId = unit?.propertyId || null;
          break;

        case "lease":
          const lease = await db.query.leaseEntity.findFirst({
            where: eq(leaseEntity.id, resourceId),
          });
          propertyId = lease?.propertyId || null;
          break;

        case "maintenance":
          const maintenance =
            await db.query.maintenanceRequestsEntity.findFirst({
              where: eq(maintenanceRequestsEntity.id, resourceId),
            });
          propertyId = maintenance?.propertyId || null;
          break;

        case "tenant":
          // For tenants, we need to check leases to find associated properties
          const tenantLeases = await db.query.leaseTenantsEntity.findMany({
            where: eq(leaseTenantsEntity.tenantId, resourceId),
            with: {
              lease: true,
            },
          });

          if (tenantLeases.length > 0) {
            const leasePropertyIds = tenantLeases
              .map((tl) => tl.lease?.propertyId)
              .filter(Boolean) as string[];

            // Check if the team has access to any of these properties
            for (const propId of leasePropertyIds) {
              const hasAccess = await teamService.isPropertyInTeam(
                member.teamId,
                propId
              );
              if (hasAccess) {
                return true;
              }
            }
          }
          return false;
      }

      // If we found a property ID, check team access
      if (propertyId) {
        return teamService.isPropertyInTeam(member.teamId, propertyId);
      }
    }

    // Check resource-level permissions (if user is in a team)
    if (member.teamId) {
      const resourcePermission =
        await db.query.resourcePermissionEntity.findFirst({
          where: and(
            eq(resourcePermissionEntity.teamId, member.teamId),
            eq(resourcePermissionEntity.resourceType, resourceType),
            eq(resourcePermissionEntity.resourceId, resourceId),
            eq(resourcePermissionEntity.action, action)
          ),
        });

      return !!resourcePermission;
    }

    // Default to role-based permission
    return true;
  }

  /**
   * Grant specific permission to a team for a resource
   */
  async grantPermission(data: {
    teamId: string;
    resourceType: string;
    resourceId: string;
    action: string;
  }): Promise<void> {
    const { teamId, resourceType, resourceId, action } = data;

    // Check if team exists
    const team = await db.query.teamEntity.findFirst({
      where: eq(teamEntity.id, teamId),
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Upsert permission
    await db
      .insert(resourcePermissionEntity)
      .values({
        teamId,
        resourceType,
        resourceId,
        action,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          resourcePermissionEntity.teamId,
          resourcePermissionEntity.resourceType,
          resourcePermissionEntity.resourceId,
          resourcePermissionEntity.action,
        ],
        set: {
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Revoke a specific permission from a team for a resource
   */
  async revokePermission(data: {
    teamId: string;
    resourceType: string;
    resourceId: string;
    action: string;
  }): Promise<void> {
    const { teamId, resourceType, resourceId, action } = data;

    await db
      .delete(resourcePermissionEntity)
      .where(
        and(
          eq(resourcePermissionEntity.teamId, teamId),
          eq(resourcePermissionEntity.resourceType, resourceType),
          eq(resourcePermissionEntity.resourceId, resourceId),
          eq(resourcePermissionEntity.action, action)
        )
      );
  }

  /**
   * Get all permissions for a team
   */
  async getTeamPermissions(teamId: string): Promise<any[]> {
    return db.query.resourcePermissionEntity.findMany({
      where: eq(resourcePermissionEntity.teamId, teamId),
    });
  }

  /**
   * Get all permissions for a resource
   */
  async getResourcePermissions(
    resourceType: string,
    resourceId: string
  ): Promise<any[]> {
    return db.query.resourcePermissionEntity.findMany({
      where: and(
        eq(resourcePermissionEntity.resourceType, resourceType),
        eq(resourcePermissionEntity.resourceId, resourceId)
      ),
      with: {
        team: true,
      },
    });
  }

  /**
   * Check if user has any access to a property (either through role or team)
   */
  async canAccessProperty(
    userId: string,
    organizationId: string,
    propertyId: string
  ): Promise<boolean> {
    return this.hasPermission({
      userId,
      organizationId,
      resourceType: "property",
      action: "view",
      resourceId: propertyId,
    });
  }

  /**
   * Get all properties a user has access to
   */
  async getUserAccessibleProperties(
    userId: string,
    organizationId: string
  ): Promise<string[]> {
    // Get user's role and team in the organization
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
      with: {
        user: true,
      },
    });

    if (!member) {
      return []; // User is not a member of the organization
    }

    // Admin and owner roles have access to all properties
    if (member.user.role === "admin" || member.role === "owner") {
      const allProperties = await db.query.propertyEntity.findMany({
        where: eq(propertyEntity.organizationId, organizationId),
      });
      return allProperties.map((p) => p.id);
    }

    // For team members, get properties assigned to their team
    if (member.teamId) {
      return teamService.getTeamPropertyIds(member.teamId);
    }

    // For property owners, get their own properties
    if (member.user.role === "property_owner") {
      const ownedProperties = await db.query.propertyEntity.findMany({
        where: and(
          eq(propertyEntity.organizationId, organizationId),
          eq(propertyEntity.ownerId, userId)
        ),
      });
      return ownedProperties.map((p) => p.id);
    }

    // For caretakers, get properties they're assigned to
    if (member.user.role === "caretaker") {
      const assignedProperties = await db.query.propertyEntity.findMany({
        where: and(
          eq(propertyEntity.organizationId, organizationId),
          eq(propertyEntity.caretakerId, userId)
        ),
      });
      return assignedProperties.map((p) => p.id);
    }

    // For tenant users, get properties they're leasing
    if (member.user.role === "tenant_user") {
      // Find tenant profile for this user
      const tenant = await db.query.tenantEntity.findFirst({
        where: and(
          eq(tenantEntity.organizationId, organizationId),
          eq(tenantEntity.userId, userId)
        ),
      });

      if (!tenant) {
        return [];
      }

      // Find leases for this tenant
      const tenantLeases = await db.query.leaseTenantsEntity.findMany({
        where: eq(leaseTenantsEntity.tenantId, tenant.id),
        with: {
          lease: true,
        },
      });

      // Extract property IDs from leases
      return tenantLeases
        .map((tl) => tl.lease?.propertyId)
        .filter(Boolean) as string[];
    }

    return []; // Default empty list
  }
}

export const permissionService = new PermissionService();
