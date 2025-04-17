import { propertyEntity } from "@/domains/properties/entities/property.entity";
import { unitEntity } from "@/domains/properties/entities/unit.entity";
import { userEntity } from "@/domains/users/entities/user.entity";
import { db } from "@/infrastructure/database";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { and, eq } from "drizzle-orm";
import { UpdateMaintenanceRequestDto } from "../dto/maintenance.dto";
import {
  MaintenanceRequest,
  NewMaintenanceRequest,
  maintenanceRequestsEntity,
} from "../entities/maintenance-request.entity";

export class MaintenanceService {
  /**
   * Get maintenance requests for an organization
   */
  async getMaintenanceRequestsByOrganization(
    organizationId: string
  ): Promise<MaintenanceRequest[]> {
    return db.query.maintenanceRequestsEntity.findMany({
      where: eq(maintenanceRequestsEntity.organizationId, organizationId),
      with: {
        property: true,
        unit: true,
        reporter: true,
        assignee: true,
      },
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });
  }

  /**
   * Get maintenance request by ID
   */
  async getMaintenanceRequestById(
    id: string,
    organizationId: string
  ): Promise<MaintenanceRequest> {
    const request = await db.query.maintenanceRequestsEntity.findFirst({
      where: and(
        eq(maintenanceRequestsEntity.id, id),
        eq(maintenanceRequestsEntity.organizationId, organizationId)
      ),
      with: {
        property: true,
        unit: true,
        reporter: true,
        assignee: true,
      },
    });

    if (!request) {
      throw new NotFoundError(`Maintenance request with ID ${id} not found`);
    }

    return request;
  }

  /**
   * Get maintenance requests for a property
   */
  async getMaintenanceRequestsByProperty(
    propertyId: string,
    organizationId: string
  ): Promise<MaintenanceRequest[]> {
    // Verify property exists and belongs to organization
    const property = await db.query.propertyEntity.findFirst({
      where: and(
        eq(propertyEntity.id, propertyId),
        eq(propertyEntity.organizationId, organizationId)
      ),
    });

    if (!property) {
      throw new NotFoundError("Property not found or not in your organization");
    }

    return db.query.maintenanceRequestsEntity.findMany({
      where: eq(maintenanceRequestsEntity.propertyId, propertyId),
      with: {
        property: true,
        unit: true,
        reporter: true,
        assignee: true,
      },
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });
  }

  /**
   * Get maintenance requests for a unit
   */
  async getMaintenanceRequestsByUnit(
    unitId: string,
    organizationId: string
  ): Promise<MaintenanceRequest[]> {
    // Verify unit exists and belongs to organization
    const unit = await db.query.unitEntity.findFirst({
      where: eq(unitEntity.id, unitId),
      with: { property: true },
    });

    if (!unit || unit.property.organizationId !== organizationId) {
      throw new NotFoundError("Unit not found or not in your organization");
    }

    return db.query.maintenanceRequestsEntity.findMany({
      where: eq(maintenanceRequestsEntity.unitId, unitId),
      with: {
        property: true,
        unit: true,
        reporter: true,
        assignee: true,
      },
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });
  }

  /**
   * Get maintenance requests assigned to a user
   */
  async getMaintenanceRequestsByAssignee(
    assigneeId: string,
    organizationId: string
  ): Promise<MaintenanceRequest[]> {
    // Verify user exists
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, assigneeId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return db.query.maintenanceRequestsEntity.findMany({
      where: and(
        eq(maintenanceRequestsEntity.assignedTo, assigneeId),
        eq(maintenanceRequestsEntity.organizationId, organizationId)
      ),
      with: {
        property: true,
        unit: true,
        reporter: true,
        assignee: true,
      },
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });
  }

  /**
   * Create a maintenance request
   */
  async createMaintenanceRequest(
    data: NewMaintenanceRequest
  ): Promise<MaintenanceRequest> {
    // Verify property exists and belongs to organization
    const property = await db.query.propertyEntity.findFirst({
      where: and(
        eq(propertyEntity.id, data.propertyId),
        eq(propertyEntity.organizationId, data.organizationId)
      ),
    });

    if (!property) {
      throw new NotFoundError("Property not found or not in your organization");
    }

    // Verify unit if provided
    if (data.unitId) {
      const unit = await db.query.unitEntity.findFirst({
        where: and(
          eq(unitEntity.id, data.unitId),
          eq(unitEntity.propertyId, data.propertyId)
        ),
      });

      if (!unit) {
        throw new NotFoundError("Unit not found in this property");
      }
    }

    // Process date strings if present
    const scheduledDate = data.scheduledDate
      ? new Date(data.scheduledDate)
      : undefined;

    // Process image URLs for before images
    let imagesBefore = data.imagesBefore || [];
    if (typeof imagesBefore === "string") {
      try {
        imagesBefore = JSON.parse(imagesBefore);
      } catch (e) {
        imagesBefore = [];
      }
    }

    // Create maintenance request
    const result = await db
      .insert(maintenanceRequestsEntity)
      .values({
        ...data,
        scheduledDate,
        status: data.status || "reported",
        priority: data.priority || "medium",
        imagesBefore,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Auto-assign to property caretaker if available
    if (property.caretakerId && !data.assignedTo) {
      await db
        .update(maintenanceRequestsEntity)
        .set({
          assignedTo: property.caretakerId,
          status: "scheduled",
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequestsEntity.id, result[0].id));

      result[0].assignedTo = property.caretakerId;
      result[0].status = "scheduled";
    }

    return result[0];
  }

  /**
   * Update a maintenance request
   */
  async updateMaintenanceRequest(
    id: string,
    organizationId: string,
    data: UpdateMaintenanceRequestDto
  ): Promise<MaintenanceRequest> {
    // Verify request exists and belongs to organization
    const request = await this.getMaintenanceRequestById(id, organizationId);

    // Process date strings if present
    const scheduledDate = data.scheduledDate
      ? new Date(data.scheduledDate)
      : undefined;
    const completedDate = data.completedDate
      ? new Date(data.completedDate)
      : undefined;

    // Process image URLs for after images
    let imagesAfter = data.imagesAfter || request.imagesAfter || [];
    if (typeof imagesAfter === "string") {
      try {
        imagesAfter = JSON.parse(imagesAfter);
      } catch (e) {
        imagesAfter = [];
      }
    }

    // Special handling for notes - append if existing
    const notes = data.notes
      ? request.notes
        ? `${request.notes}\n\n${data.notes}`
        : data.notes
      : request.notes;

    // Update request
    const result = await db
      .update(maintenanceRequestsEntity)
      .set({
        title: data.title !== undefined ? data.title : request.title,
        description:
          data.description !== undefined
            ? data.description
            : request.description,
        status: data.status || request.status,
        priority: data.priority || request.priority,
        assignedTo:
          data.assignedTo !== undefined ? data.assignedTo : request.assignedTo,
        scheduledDate:
          scheduledDate !== undefined ? scheduledDate : request.scheduledDate,
        completedDate:
          completedDate !== undefined ? completedDate : request.completedDate,
        actualCost:
          data.actualCost !== undefined ? data.actualCost : request.actualCost,
        notes,
        imagesAfter,
        vendor: data.vendor !== undefined ? data.vendor : request.vendor,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(maintenanceRequestsEntity.id, id),
          eq(maintenanceRequestsEntity.organizationId, organizationId)
        )
      )
      .returning();

    return result[0];
  }

  /**
   * Assign a maintenance request to a user
   */
  async assignMaintenanceRequest(
    id: string,
    organizationId: string,
    assigneeId: string
  ): Promise<MaintenanceRequest> {
    // Verify request exists and belongs to organization
    const request = await this.getMaintenanceRequestById(id, organizationId);

    // Verify assignee exists
    const assignee = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, assigneeId),
    });

    if (!assignee) {
      throw new NotFoundError("Assignee not found");
    }

    // Update request with assignee and change status if in 'reported' state
    const newStatus =
      request.status === "reported" ? "scheduled" : request.status;

    const result = await db
      .update(maintenanceRequestsEntity)
      .set({
        assignedTo: assigneeId,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceRequestsEntity.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a maintenance request
   */
  async deleteMaintenanceRequest(
    id: string,
    organizationId: string
  ): Promise<void> {
    // Verify request exists and belongs to organization
    await this.getMaintenanceRequestById(id, organizationId);

    await db
      .delete(maintenanceRequestsEntity)
      .where(
        and(
          eq(maintenanceRequestsEntity.id, id),
          eq(maintenanceRequestsEntity.organizationId, organizationId)
        )
      );
  }

  // Helper methods for resolvers

  /**
   * Get property for a maintenance request
   */
  async getPropertyForRequest(propertyId: string): Promise<any> {
    return db.query.propertyEntity.findFirst({
      where: eq(propertyEntity.id, propertyId),
    });
  }

  /**
   * Get unit for a maintenance request
   */
  async getUnitForRequest(unitId: string): Promise<any> {
    return db.query.unitEntity.findFirst({
      where: eq(unitEntity.id, unitId),
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    return db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });
  }
}

export const maintenanceService = new MaintenanceService();
