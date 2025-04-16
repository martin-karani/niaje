// src/services/core/leases.service.ts
import { db } from "@/db";
import { leases, leaseTenants, tenants, units } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export class LeasesService {
  /**
   * Create a new lease
   */
  async createLease(data: {
    organizationId: string;
    unitId: string;
    tenantIds: string[]; // Array of tenant IDs to assign to lease
    startDate: Date;
    endDate: Date;
    rentAmount: number;
    depositAmount: number;
    paymentDay: number;
    createdBy: string; // User ID of creator
    // Other lease fields
  }) {
    // Verify unit exists
    const unit = await db.query.units.findFirst({
      where: eq(units.id, data.unitId),
      with: {
        property: true,
      },
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    // Verify tenants exist
    const foundTenants = await db.query.tenants.findMany({
      where: inArray(tenants.id, data.tenantIds),
    });

    if (foundTenants.length !== data.tenantIds.length) {
      throw new Error("One or more tenants not found");
    }

    // Check for conflicting leases on this unit
    const conflictingLease = await db.query.leases.findFirst({
      where: and(
        eq(leases.unitId, data.unitId),
        eq(leases.status, "active"),
        or(
          and(
            lte(leases.startDate, data.startDate),
            gte(leases.endDate, data.startDate)
          ),
          and(
            lte(leases.startDate, data.endDate),
            gte(leases.endDate, data.endDate)
          )
        )
      ),
    });

    if (conflictingLease) {
      throw new Error("Unit already has an active lease during this period");
    }

    // Create the lease
    const newLease = await db
      .insert(leases)
      .values({
        organizationId: data.organizationId,
        unitId: data.unitId,
        propertyId: unit.propertyId,
        startDate: data.startDate,
        endDate: data.endDate,
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        paymentDay: data.paymentDay,
        status: "draft", // Set to draft initially
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Other fields with defaults or from data
      })
      .returning();

    // Create tenant assignments
    for (const tenantId of data.tenantIds) {
      await db.insert(leaseTenants).values({
        leaseId: newLease[0].id,
        tenantId,
        isPrimary: tenantId === data.tenantIds[0], // First tenant is primary
        createdAt: new Date(),
      });
    }

    return {
      ...newLease[0],
      tenants: foundTenants,
    };
  }

  /**
   * Get leases by property
   */
  async getLeasesByProperty(propertyId: string) {
    const unitsInProperty = await db.query.units.findMany({
      where: eq(units.propertyId, propertyId),
      columns: {
        id: true,
      },
    });

    const unitIds = unitsInProperty.map((unit) => unit.id);

    return db.query.leases.findMany({
      where: inArray(leases.unitId, unitIds),
      with: {
        unit: true,
        tenantAssignments: {
          with: {
            tenant: true,
          },
        },
      },
    });
  }

  /**
   * Activate lease
   */
  async activateLease(leaseId: string) {
    // Check if lease exists
    const lease = await db.query.leases.findFirst({
      where: eq(leases.id, leaseId),
    });

    if (!lease) {
      throw new Error("Lease not found");
    }

    // Update unit status to occupied
    await db
      .update(units)
      .set({
        status: "occupied",
        currentRent: lease.rentAmount,
        updatedAt: new Date(),
      })
      .where(eq(units.id, lease.unitId));

    // Activate the lease
    const result = await db
      .update(leases)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(leases.id, leaseId))
      .returning();

    return result[0];
  }

  /**
   * Terminate lease
   */
  async terminateLease(leaseId: string, terminationDate: Date, reason: string) {
    // Check if lease exists
    const lease = await db.query.leases.findFirst({
      where: eq(leases.id, leaseId),
    });

    if (!lease) {
      throw new Error("Lease not found");
    }

    // Update unit status to vacant
    await db
      .update(units)
      .set({
        status: "vacant",
        currentRent: null,
        updatedAt: new Date(),
      })
      .where(eq(units.id, lease.unitId));

    // Terminate the lease
    const result = await db
      .update(leases)
      .set({
        status: "terminated",
        moveOutDate: terminationDate,
        notes: lease.notes
          ? `${lease.notes}\n\nTermination reason: ${reason}`
          : `Termination reason: ${reason}`,
        updatedAt: new Date(),
      })
      .where(eq(leases.id, leaseId))
      .returning();

    return result[0];
  }
}

export const leasesService = new LeasesService();
