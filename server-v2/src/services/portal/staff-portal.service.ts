// src/services/portal/staff-portal.service.ts
import { db } from "@/db";
import {
  maintenanceRequests,
  member,
  properties,
  tenants,
  units,
} from "@/db/schema";
import { and, count, eq } from "drizzle-orm";

export class StaffPortalService {
  /**
   * Get staff member's dashboard summary
   */
  async getStaffDashboard(userId: string, organizationId: string) {
    // Verify staff membership
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId)
      ),
      with: {
        team: true,
      },
    });

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    const teamId = membership.teamId;

    // Get properties assigned to this staff's team
    let assignedProperties = [];
    if (teamId) {
      assignedProperties = await db.query.properties.findMany({
        where: eq(properties.metadata.teamId, teamId),
      });
    }

    const propertyIds = assignedProperties.map((p) => p.id);

    // Count units
    const unitCount =
      propertyIds.length > 0
        ? await db
            .select({ count: count() })
            .from(units)
            .where(inArray(units.propertyId, propertyIds))
            .then((result) => result[0]?.count || 0)
        : 0;

    // Count tenants
    // This is more complex as tenants are linked via leases to units
    // Simplified version:
    const tenantCount = await db.query.tenants
      .findMany({
        where: eq(tenants.organizationId, organizationId),
      })
      .then((results) => results.length);

    // Count open maintenance requests
    const maintenanceCount =
      propertyIds.length > 0
        ? await db
            .select({ count: count() })
            .from(maintenanceRequests)
            .where(
              and(
                inArray(maintenanceRequests.propertyId, propertyIds),
                inArray(maintenanceRequests.status, [
                  "reported",
                  "scheduled",
                  "in_progress",
                ])
              )
            )
            .then((result) => result[0]?.count || 0)
        : 0;

    // Get pending tasks (could be maintenance requests assigned to this user)
    const pendingTasks = await db.query.maintenanceRequests.findMany({
      where: and(
        eq(maintenanceRequests.assignedTo, userId),
        inArray(maintenanceRequests.status, ["scheduled", "in_progress"])
      ),
      with: {
        property: true,
        unit: true,
      },
      limit: 5,
    });

    return {
      team: membership.team,
      counts: {
        properties: propertyIds.length,
        units: unitCount,
        tenants: tenantCount,
        maintenanceRequests: maintenanceCount,
      },
      pendingTasks: pendingTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        property: task.property.name,
        unit: task.unit?.name,
        scheduledDate: task.scheduledDate,
      })),
    };
  }

  /**
   * Get assigned properties
   */
  async getAssignedProperties(userId: string, organizationId: string) {
    // Get the staff member's team
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!membership || !membership.teamId) {
      return []; // No team assigned, so no properties
    }

    // Get properties assigned to this team
    return db.query.properties.findMany({
      where: eq(properties.metadata.teamId, membership.teamId),
      with: {
        propertyOwner: true,
        propertyCaretaker: true,
        units: true,
      },
    });
  }

  /**
   * Get assigned maintenance tasks
   */
  async getAssignedMaintenanceTasks(userId: string) {
    return db.query.maintenanceRequests.findMany({
      where: eq(maintenanceRequests.assignedTo, userId),
      with: {
        property: true,
        unit: true,
        reporter: true,
      },
    });
  }

  /**
   * Get staff team members
   */
  async getTeamMembers(userId: string, organizationId: string) {
    // Get the staff member's team
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!membership || !membership.teamId) {
      return []; // No team assigned
    }

    // Get all members of this team
    return db.query.member.findMany({
      where: eq(member.teamId, membership.teamId),
      with: {
        user: true,
      },
    });
  }
}

export const staffPortalService = new StaffPortalService();
