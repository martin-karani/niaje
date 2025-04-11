// src/permissions/service.ts
import { db } from "@/db";
import { properties, userPermissions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Permission, PropertyPermission, ROLE_PERMISSIONS } from "../models";

export class PermissionService {
  /**
   * Checks if a user has a specific permission based on their role
   */
  async hasPermission(
    userId: string,
    userRole: string,
    permission: Permission
  ): Promise<boolean> {
    // Admins have all permissions
    if (userRole === "ADMIN") return true;

    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    return rolePerms.includes(permission);
  }

  /**
   * Checks if a user has permission for a specific property
   */
  async hasPropertyPermission(
    userId: string,
    userRole: string,
    propertyId: string,
    permission: Permission
  ): Promise<boolean> {
    // Admins have all permissions
    if (userRole === "ADMIN") return true;

    // First check - is the user the property owner?
    const isOwner = await db.query.properties.findFirst({
      where: and(eq(properties.id, propertyId), eq(properties.ownerId, userId)),
    });

    if (isOwner) {
      // Property owners have all permissions for their properties
      return true;
    }

    // For caretakers and agents, check if they are assigned to this property
    if (userRole === "CARETAKER") {
      const isCaretaker = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, propertyId),
          eq(properties.caretakerId, userId)
        ),
      });

      if (isCaretaker) {
        // Check if caretaker role has this permission
        const caretakerPerms = ROLE_PERMISSIONS["CARETAKER"] || [];
        return caretakerPerms.includes(permission);
      }
    }

    if (userRole === "AGENT") {
      const isAgent = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, propertyId),
          eq(properties.agentId, userId)
        ),
      });

      if (isAgent) {
        // Check if agent role has this permission
        const agentPerms = ROLE_PERMISSIONS["AGENT"] || [];
        return agentPerms.includes(permission);
      }
    }

    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    if (!rolePerms.includes(permission)) {
      return false;
    }

    // Finally, check property-specific permissions in the database
    const permField = this.mapPermissionToDbField(permission);
    if (!permField) return false;

    const userPerm = await db.query.userPermissions.findFirst({
      where: and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.propertyId, propertyId)
      ),
    });

    return userPerm ? !!userPerm[permField] : false;
  }

  /**
   * Maps permission strings to database fields
   */
  private mapPermissionToDbField(
    permission: Permission
  ): keyof typeof userPermissions.$inferSelect | null {
    const permissionMap: Record<
      Permission,
      keyof typeof userPermissions.$inferSelect | null
    > = {
      "tenants:manage": "canManageTenants",
      "tenants:view": null, // Implied by manage
      "leases:manage": "canManageLeases",
      "leases:view": null, // Implied by manage
      "payments:collect": "canCollectPayments",
      "payments:view": "canViewFinancials",
      "maintenance:manage": "canManageMaintenance",
      "maintenance:view": null, // Implied by manage
      "properties:manage": "canManageProperties",
      "properties:view": null, // Implied by manage
      "reports:view": "canViewFinancials",
      "users:manage": null, // System permission
      "roles:manage": null, // System permission
    };

    return permissionMap[permission];
  }

  /**
   * Gets all permissions for a user
   */
  async getUserPermissions(
    userId: string,
    userRole: string
  ): Promise<{
    systemPermissions: Permission[];
    propertyPermissions: PropertyPermission[];
  }> {
    // Get role-based permissions
    const systemPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Get property-specific permissions
    const propertyPermissions: PropertyPermission[] = [];

    // 1. Get properties owned by the user (if LANDLORD)
    if (userRole === "LANDLORD") {
      const ownedProperties = await db.query.properties.findMany({
        where: eq(properties.ownerId, userId),
        columns: { id: true },
      });

      // For owned properties, the user has all permissions
      for (const prop of ownedProperties) {
        propertyPermissions.push({
          propertyId: prop.id,
          permissions: ROLE_PERMISSIONS["LANDLORD"],
        });
      }
    }

    // 2. Get properties where user is caretaker
    if (userRole === "CARETAKER") {
      const managedProperties = await db.query.properties.findMany({
        where: eq(properties.caretakerId, userId),
        columns: { id: true },
      });

      for (const prop of managedProperties) {
        propertyPermissions.push({
          propertyId: prop.id,
          permissions: ROLE_PERMISSIONS["CARETAKER"],
        });
      }
    }

    // 3. Get properties where user is agent
    if (userRole === "AGENT") {
      const agentProperties = await db.query.properties.findMany({
        where: eq(properties.agentId, userId),
        columns: { id: true },
      });

      for (const prop of agentProperties) {
        propertyPermissions.push({
          propertyId: prop.id,
          permissions: ROLE_PERMISSIONS["AGENT"],
        });
      }
    }

    // 4. Get explicitly granted permissions
    const explicitPerms = await db.query.userPermissions.findMany({
      where: eq(userPermissions.userId, userId),
    });

    for (const perm of explicitPerms) {
      const permArray: Permission[] = [];

      // Map database fields to permission strings
      if (perm.canManageTenants) {
        permArray.push("tenants:manage", "tenants:view");
      }
      if (perm.canManageLeases) {
        permArray.push("leases:manage", "leases:view");
      }
      if (perm.canCollectPayments) {
        permArray.push("payments:collect");
      }
      if (perm.canViewFinancials) {
        permArray.push("payments:view", "reports:view");
      }
      if (perm.canManageMaintenance) {
        permArray.push("maintenance:manage", "maintenance:view");
      }
      if (perm.canManageProperties) {
        permArray.push("properties:manage", "properties:view");
      }

      // Add to property permissions
      if (permArray.length) {
        propertyPermissions.push({
          propertyId: perm.propertyId,
          permissions: permArray,
        });
      }
    }

    return { systemPermissions, propertyPermissions };
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
