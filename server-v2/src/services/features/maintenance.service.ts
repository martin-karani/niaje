// src/services/features/maintenance.service.ts
import { db } from "@/db";
import { maintenanceRequests, properties, units, user } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export class MaintenanceService {
  /**
   * Create maintenance request
   */
  async createMaintenanceRequest(data: {
    organizationId: string;
    propertyId: string;
    unitId?: string; // Optional - not all requests are unit-specific
    title: string;
    description: string;
    priority?: string;
    category?: string;
    reportedBy: string; // User ID who reported issue
    permissionToEnter?: boolean;
    preferredAvailability?: string;
    estimatedCost?: number;
    scheduledDate?: Date;
    imageUrls?: string[]; // Array of image URLs
  }) {
    // Verify property exists
    const property = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, data.propertyId),
        eq(properties.organizationId, data.organizationId)
      ),
    });

    if (!property) {
      throw new Error("Property not found or not in this organization");
    }

    // Verify unit if provided
    if (data.unitId) {
      const unit = await db.query.units.findFirst({
        where: and(
          eq(units.id, data.unitId),
          eq(units.propertyId, data.propertyId)
        ),
      });

      if (!unit) {
        throw new Error("Unit not found in this property");
      }
    }

    // Verify reporter exists
    const reporter = await db.query.user.findFirst({
      where: eq(user.id, data.reportedBy),
    });

    if (!reporter) {
      throw new Error("Reporter not found");
    }

    // Create the maintenance request
    const result = await db
      .insert(maintenanceRequests)
      .values({
        organizationId: data.organizationId,
        propertyId: data.propertyId,
        unitId: data.unitId,
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        category: data.category,
        reportedBy: data.reportedBy,
        permissionToEnter: data.permissionToEnter || false,
        preferredAvailability: data.preferredAvailability,
        estimatedCost: data.estimatedCost,
        scheduledDate: data.scheduledDate,
        status: "reported",
        imagesBefore: data.imageUrls ? data.imageUrls : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // If caretaker exists for property, auto-assign
    if (property.caretakerId) {
      await db
        .update(maintenanceRequests)
        .set({
          assignedTo: property.caretakerId,
          status: "scheduled",
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequests.id, result[0].id));

      result[0].assignedTo = property.caretakerId;
      result[0].status = "scheduled";
    }

    return result[0];
  }

  /**
   * Assign maintenance request
   */
  async assignMaintenanceRequest(id: string, assigneeId: string) {
    // Verify request exists
    const request = await db.query.maintenanceRequests.findFirst({
      where: eq(maintenanceRequests.id, id),
    });

    if (!request) {
      throw new Error("Maintenance request not found");
    }

    // Verify assignee exists
    const assignee = await db.query.user.findFirst({
      where: eq(user.id, assigneeId),
    });

    if (!assignee) {
      throw new Error("Assignee not found");
    }

    // Update request with assignee
    const result = await db
      .update(maintenanceRequests)
      .set({
        assignedTo: assigneeId,
        status: "scheduled", // Update status to scheduled
        updatedAt: new Date(),
      })
      .where(eq(maintenanceRequests.id, id))
      .returning();

    return result[0];
  }

  /**
   * Update maintenance request status
   */
  async updateRequestStatus(
    id: string,
    data: {
      status: string;
      completedDate?: Date;
      actualCost?: number;
      notes?: string;
      imagesAfter?: string[];
    }
  ) {
    // Verify request exists
    const request = await db.query.maintenanceRequests.findFirst({
      where: eq(maintenanceRequests.id, id),
    });

    if (!request) {
      throw new Error("Maintenance request not found");
    }

    // Update request status
    const result = await db
      .update(maintenanceRequests)
      .set({
        status: data.status,
        completedDate:
          data.status === "completed"
            ? data.completedDate || new Date()
            : request.completedDate,
        actualCost: data.actualCost,
        notes: data.notes
          ? request.notes
            ? `${request.notes}\n\n${data.notes}`
            : data.notes
          : request.notes,
        imagesAfter: data.imagesAfter || request.imagesAfter,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceRequests.id, id))
      .returning();

    return result[0];
  }

  /**
   * Get property maintenance history
   */
  async getPropertyMaintenanceHistory(propertyId: string) {
    return db.query.maintenanceRequests.findMany({
      where: eq(maintenanceRequests.propertyId, propertyId),
      orderBy: [desc(maintenanceRequests.createdAt)],
      with: {
        unit: true,
        reporter: true,
        assignee: true,
      },
    });
  }
}

export const maintenanceService = new MaintenanceService();
