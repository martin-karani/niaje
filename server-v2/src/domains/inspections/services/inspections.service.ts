import { leaseEntity } from "@domains/leases/entities/lease.entity"; // Adjusted path
import { propertyEntity } from "@domains/properties/entities/property.entity"; // Adjusted path
import { unitEntity } from "@domains/properties/entities/unit.entity"; // Adjusted path
import { userEntity } from "@domains/users/entities/user.entity"; // Adjusted path
import { db } from "@infrastructure/database"; // Adjusted path
import { NotFoundError } from "@shared/errors/not-found.error"; // Adjusted path
import { ValidationError } from "@shared/errors/validation.error"; // Adjusted path
import { and, eq, gte, or } from "drizzle-orm";
import {
  CompleteInspectionDto,
  UpdateInspectionDto,
} from "../dto/inspection.dto";
import {
  Inspection,
  NewInspection,
  inspectionEntity,
} from "../entities/inspection.entity";

export class InspectionsService {
  /**
   * Get inspections for an organization
   */
  async getInspectionsByOrganization(
    organizationId: string
  ): Promise<Inspection[]> {
    return db.query.inspectionEntity.findMany({
      where: eq(inspectionEntity.organizationId, organizationId),
      with: {
        property: true,
        unit: true,
        lease: true,
        inspector: true,
      },
      orderBy: (inspections, { desc }) => [desc(inspections.scheduledDate)],
    });
  }

  /**
   * Get inspection by ID
   */
  async getInspectionById(
    id: string,
    organizationId: string
  ): Promise<Inspection> {
    const inspection = await db.query.inspectionEntity.findFirst({
      where: and(
        eq(inspectionEntity.id, id),
        eq(inspectionEntity.organizationId, organizationId)
      ),
      with: {
        property: true,
        unit: true,
        lease: true,
        inspector: true,
        documents: true,
      },
    });

    if (!inspection) {
      throw new NotFoundError(`Inspection with ID ${id} not found`);
    }

    return inspection;
  }

  /**
   * Get inspections for a property
   */
  async getInspectionsByProperty(
    propertyId: string,
    organizationId: string
  ): Promise<Inspection[]> {
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

    return db.query.inspectionEntity.findMany({
      where: eq(inspectionEntity.propertyId, propertyId),
      with: {
        property: true,
        unit: true,
        lease: true,
        inspector: true,
      },
      orderBy: (inspections, { desc }) => [desc(inspections.scheduledDate)],
    });
  }

  /**
   * Get inspections for a unit
   */
  async getInspectionsByUnit(
    unitId: string,
    organizationId: string
  ): Promise<Inspection[]> {
    // Verify unit exists and belongs to organization
    const unit = await db.query.unitEntity.findFirst({
      where: eq(unitEntity.id, unitId),
      with: { property: true },
    });

    if (!unit || unit.property.organizationId !== organizationId) {
      throw new NotFoundError("Unit not found or not in your organization");
    }

    return db.query.inspectionEntity.findMany({
      where: eq(inspectionEntity.unitId, unitId),
      with: {
        property: true,
        unit: true,
        lease: true,
        inspector: true,
      },
      orderBy: (inspections, { desc }) => [desc(inspections.scheduledDate)],
    });
  }

  /**
   * Get inspections for a lease
   */
  async getInspectionsByLease(
    leaseId: string,
    organizationId: string
  ): Promise<Inspection[]> {
    // Verify lease exists and belongs to organization
    const lease = await db.query.leaseEntity.findFirst({
      where: and(
        eq(leaseEntity.id, leaseId),
        eq(leaseEntity.organizationId, organizationId)
      ),
    });

    if (!lease) {
      throw new NotFoundError("Lease not found or not in your organization");
    }

    return db.query.inspectionEntity.findMany({
      where: eq(inspectionEntity.leaseId, leaseId),
      with: {
        property: true,
        unit: true,
        lease: true,
        inspector: true,
      },
      orderBy: (inspections, { desc }) => [desc(inspections.scheduledDate)],
    });
  }

  /**
   * Get upcoming inspections
   */
  async getUpcomingInspections(
    organizationId: string,
    limit: number = 10
  ): Promise<Inspection[]> {
    const now = new Date();

    return db.query.inspectionEntity.findMany({
      where: and(
        eq(inspectionEntity.organizationId, organizationId),
        eq(inspectionEntity.status, "scheduled"),
        or(gte(inspectionEntity.scheduledDate, now))
      ),
      with: {
        property: true,
        unit: true,
        lease: true,
        inspector: true,
      },
      orderBy: (inspections, { asc }) => [asc(inspections.scheduledDate)],
      limit,
    });
  }

  /**
   * Create an inspection
   */
  async createInspection(data: NewInspection): Promise<Inspection> {
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

    // Verify lease if provided
    if (data.leaseId) {
      const lease = await db.query.leaseEntity.findFirst({
        where: and(
          eq(leaseEntity.id, data.leaseId),
          eq(leaseEntity.organizationId, data.organizationId)
        ),
      });

      if (!lease) {
        throw new NotFoundError("Lease not found or not in your organization");
      }

      // If unit is not provided but lease is, automatically set unit from lease
      if (!data.unitId) {
        data.unitId = lease.unitId;
      }

      // Verify unit and lease match
      if (data.unitId !== lease.unitId) {
        throw new ValidationError(
          "Unit ID does not match the unit in the lease"
        );
      }
    }

    // Verify inspector if provided
    if (data.inspectorId) {
      const inspector = await db.query.userEntity.findFirst({
        where: eq(userEntity.id, data.inspectorId),
      });

      if (!inspector) {
        throw new NotFoundError("Inspector not found");
      }
    }

    // Process date
    const scheduledDate = new Date(data.scheduledDate);

    // Create inspection
    const result = await db
      .insert(inspectionEntity)
      .values({
        ...data,
        scheduledDate,
        status: "scheduled",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Update an inspection
   */
  async updateInspection(
    id: string,
    organizationId: string,
    data: UpdateInspectionDto
  ): Promise<Inspection> {
    // Verify inspection exists and belongs to organization
    const inspection = await this.getInspectionById(id, organizationId);

    // Process dates if present
    const scheduledDate = data.scheduledDate
      ? new Date(data.scheduledDate)
      : undefined;
    const completedDate = data.completedDate
      ? new Date(data.completedDate)
      : undefined;

    // Update inspection
    const result = await db
      .update(inspectionEntity)
      .set({
        status: data.status || undefined,
        scheduledDate: scheduledDate,
        completedDate: completedDate,
        inspectorId:
          data.inspectorId !== undefined ? data.inspectorId : undefined,
        summary: data.summary !== undefined ? data.summary : undefined,
        conditionRating:
          data.conditionRating !== undefined ? data.conditionRating : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        findings: data.findings !== undefined ? data.findings : undefined,
        tenantSignature:
          data.tenantSignature !== undefined ? data.tenantSignature : undefined,
        inspectorSignature:
          data.inspectorSignature !== undefined
            ? data.inspectorSignature
            : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inspectionEntity.id, id),
          eq(inspectionEntity.organizationId, organizationId)
        )
      )
      .returning();

    return result[0];
  }

  /**
   * Complete an inspection
   */
  async completeInspection(
    id: string,
    organizationId: string,
    data: CompleteInspectionDto
  ): Promise<Inspection> {
    // Verify inspection exists and belongs to organization
    const inspection = await this.getInspectionById(id, organizationId);

    // Can only complete inspections that are in scheduled or pending_report status
    if (
      inspection.status !== "scheduled" &&
      inspection.status !== "pending_report"
    ) {
      throw new ValidationError(
        `Cannot complete inspection with status: ${inspection.status}`
      );
    }

    // Process completed date
    const completedDate = data.completedDate
      ? new Date(data.completedDate)
      : new Date();

    // Update inspection
    const result = await db
      .update(inspectionEntity)
      .set({
        status: "completed",
        completedDate,
        summary: data.summary,
        conditionRating: data.conditionRating,
        notes: data.notes,
        findings: data.findings,
        tenantSignature: data.tenantSignature,
        inspectorSignature: data.inspectorSignature,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inspectionEntity.id, id),
          eq(inspectionEntity.organizationId, organizationId)
        )
      )
      .returning();

    return result[0];
  }

  /**
   * Cancel an inspection
   */
  async cancelInspection(
    id: string,
    organizationId: string,
    reason: string
  ): Promise<Inspection> {
    // Verify inspection exists and belongs to organization
    const inspection = await this.getInspectionById(id, organizationId);

    // Can only cancel inspections that are in scheduled status
    if (inspection.status !== "scheduled") {
      throw new ValidationError(
        `Cannot cancel inspection with status: ${inspection.status}`
      );
    }

    // Update inspection
    const result = await db
      .update(inspectionEntity)
      .set({
        status: "canceled",
        notes: inspection.notes
          ? `${inspection.notes}\n\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inspectionEntity.id, id),
          eq(inspectionEntity.organizationId, organizationId)
        )
      )
      .returning();

    return result[0];
  }

  /**
   * Delete an inspection
   */
  async deleteInspection(id: string, organizationId: string): Promise<void> {
    // Verify inspection exists and belongs to organization
    await this.getInspectionById(id, organizationId);

    await db
      .delete(inspectionEntity)
      .where(
        and(
          eq(inspectionEntity.id, id),
          eq(inspectionEntity.organizationId, organizationId)
        )
      );
  }

  /**
   * Create move-in inspection for a lease
   */
  async createMoveInInspection(
    leaseId: string,
    organizationId: string,
    scheduledDate: Date,
    inspectorId?: string
  ): Promise<Inspection> {
    // Get lease details
    const lease = await db.query.leaseEntity.findFirst({
      where: and(
        eq(leaseEntity.id, leaseId),
        eq(leaseEntity.organizationId, organizationId)
      ),
      with: {
        unit: {
          with: {
            property: true,
          },
        },
      },
    });

    if (!lease) {
      throw new NotFoundError("Lease not found or not in your organization");
    }

    // Create inspection
    return this.createInspection({
      organizationId,
      propertyId: lease.unit.property.id,
      unitId: lease.unitId,
      leaseId,
      type: "move_in",
      scheduledDate,
      inspectorId,
      status: "scheduled",
    });
  }

  /**
   * Create move-out inspection for a lease
   */
  async createMoveOutInspection(
    leaseId: string,
    organizationId: string,
    scheduledDate: Date,
    inspectorId?: string
  ): Promise<Inspection> {
    // Get lease details
    const lease = await db.query.leaseEntity.findFirst({
      where: and(
        eq(leaseEntity.id, leaseId),
        eq(leaseEntity.organizationId, organizationId)
      ),
      with: {
        unit: {
          with: {
            property: true,
          },
        },
      },
    });

    if (!lease) {
      throw new NotFoundError("Lease not found or not in your organization");
    }

    // Create inspection
    return this.createInspection({
      organizationId,
      propertyId: lease.unit.property.id,
      unitId: lease.unitId,
      leaseId,
      type: "move_out",
      scheduledDate,
      inspectorId,
      status: "scheduled",
    });
  }
}

export const inspectionsService = new InspectionsService();
