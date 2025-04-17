import { db } from "@/db";
import { inspections, properties, units } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export class InspectionsService {
  /**
   * Get inspections by property
   */
  async getInspectionsByProperty(propertyId: string) {
    return db.query.inspections.findMany({
      where: eq(inspections.propertyId, propertyId),
      with: {
        inspector: true,
        unit: true,
        documents: true,
      },
    });
  }

  /**
   * Get inspection by ID
   */
  async getInspectionById(id: string) {
    return db.query.inspections.findFirst({
      where: eq(inspections.id, id),
      with: {
        inspector: true,
        unit: true,
        property: true,
        documents: true,
      },
    });
  }

  /**
   * Create a new inspection
   */
  async createInspection(data: {
    organizationId: string;
    propertyId: string;
    unitId?: string;
    leaseId?: string;
    type: string;
    scheduledDate: Date;
    inspectorId: string;
    summary?: string;
    notes?: string;
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

    // Create the inspection
    const result = await db
      .insert(inspections)
      .values({
        ...data,
        status: "scheduled",
        findings: {},
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
    data: Partial<{
      status: string;
      scheduledDate: Date;
      completedDate: Date;
      inspectorId: string;
      summary: string;
      conditionRating: number;
      notes: string;
      findings: Record<string, any>;
      tenantSignature: string;
      inspectorSignature: string;
    }>
  ) {
    const result = await db
      .update(inspections)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(inspections.id, id))
      .returning();

    return result[0];
  }

  /**
   * Complete an inspection
   */
  async completeInspection(
    id: string,
    data: {
      conditionRating: number;
      summary: string;
      findings: Record<string, any>;
      notes?: string;
      tenantSignature?: string;
      inspectorSignature?: string;
    }
  ) {
    const result = await db
      .update(inspections)
      .set({
        status: "completed",
        completedDate: new Date(),
        conditionRating: data.conditionRating,
        summary: data.summary,
        findings: data.findings,
        notes: data.notes,
        tenantSignature: data.tenantSignature,
        inspectorSignature: data.inspectorSignature,
        updatedAt: new Date(),
      })
      .where(eq(inspections.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete an inspection
   */
  async deleteInspection(id: string) {
    await db.delete(inspections).where(eq(inspections.id, id));
    return true;
  }
}

export const inspectionsService = new InspectionsService();
