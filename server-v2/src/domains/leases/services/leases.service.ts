import { unitEntity } from "@/domains/properties/entities/unit.entity";
import { leaseTenantsEntity } from "@/domains/tenants/entities/lease-tenant.entity";
import { db } from "@/infrastructure/database";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { and, eq } from "drizzle-orm";
import { CreateLeaseDto, UpdateLeaseDto } from "../dto/lease.dto";
import { Lease, NewLease, leaseEntity } from "../entities/lease.entity";

export class LeasesService {
  private async checkLeaseOrg(
    leaseId: string,
    organizationId: string
  ): Promise<Lease> {
    const lease = await this.getLeaseById(leaseId);
    if (lease.organizationId !== organizationId) {
      throw new NotFoundError(
        `Lease with ID ${leaseId} not found in your organization.`
      );
    }
    return lease;
  }

  async getLeasesByOrganization(organizationId: string): Promise<Lease[]> {
    return db.query.leaseEntity.findMany({
      where: eq(leaseEntity.organizationId, organizationId),
      with: {
        unit: {
          with: {
            property: true,
          },
        },
        tenantAssignments: {
          with: {
            tenant: true,
          },
        },
        creator: true,
      },
      orderBy: (leases, { desc }) => [desc(leases.createdAt)],
    });
  }

  async getLeaseById(id: string): Promise<Lease> {
    const lease = await db.query.leaseEntity.findFirst({
      where: eq(leaseEntity.id, id),
      with: {
        unit: { with: { property: true } },
        tenantAssignments: { with: { tenant: true } },
        creator: true,
        payments: true,
        utilityBills: true,
        documents: true,
      },
    });

    if (!lease) {
      throw new NotFoundError(`Lease with ID ${id} not found`);
    }

    return lease;
  }

  async getLeasesByProperty(
    propertyId: string,
    organizationId: string
  ): Promise<Lease[]> {
    return db.query.leaseEntity.findMany({
      where: and(
        eq(leaseEntity.propertyId, propertyId),
        eq(leaseEntity.organizationId, organizationId)
      ),
      with: {
        unit: true,
        tenantAssignments: { with: { tenant: true } },
        creator: true,
      },
      orderBy: (leases, { desc }) => [desc(leases.startDate)],
    });
  }

  async getLeasesByUnit(
    unitId: string,
    organizationId: string
  ): Promise<Lease[]> {
    return db.query.leaseEntity.findMany({
      where: and(
        eq(leaseEntity.unitId, unitId),
        eq(leaseEntity.organizationId, organizationId)
      ),
      with: {
        tenantAssignments: { with: { tenant: true } },
        creator: true,
      },
      orderBy: (leases, { desc }) => [desc(leases.startDate)],
    });
  }

  async getLeasesByTenant(
    tenantId: string,
    organizationId: string
  ): Promise<Lease[]> {
    const assignments = await db.query.leaseTenantsEntity.findMany({
      where: eq(leaseTenantsEntity.tenantId, tenantId),
      with: {
        lease: {
          where: eq(leaseEntity.organizationId, organizationId),
          with: {
            unit: { with: { property: true } },
            creator: true,
            tenantAssignments: { with: { tenant: true } },
          },
        },
      },
    });
    // Filter out leases that might be null if org check failed and map
    return assignments.filter((a) => a.lease).map((a) => a.lease as Lease);
  }

  async createLease(data: CreateLeaseDto): Promise<Lease> {
    // 1. Validate Unit and derive Property/Org ID
    const unit = await db.query.unitEntity.findFirst({
      where: and(
        eq(unitEntity.id, data.unitId),
        eq(unitEntity.organizationId, data.organizationId) // Ensure unit belongs to the creating org
      ),
    });
    if (!unit) {
      throw new NotFoundError(
        `Unit with ID ${data.unitId} not found in organization ${data.organizationId}.`
      );
    }

    // 2. Check for overlapping active leases on the same unit (optional but recommended)
    // Add logic here if needed...

    // 3. Convert date strings to Date objects
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const moveInDate = data.moveInDate ? new Date(data.moveInDate) : null;
    // Add other date conversions...

    const result = await db
      .insert(leaseEntity)
      .values({
        ...data,
        propertyId: unit.propertyId,
        startDate: startDate,
        endDate: endDate,
        moveInDate: moveInDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update unit status to 'occupied' if lease is active
    if (result[0].status === "active") {
      await db
        .update(unitEntity)
        .set({ status: "occupied", updatedAt: new Date() })
        .where(eq(unitEntity.id, data.unitId));
    }

    return result[0];
  }

  async updateLease(
    id: string,
    organizationId: string,
    data: Partial<Omit<UpdateLeaseDto, "id">> // Exclude id from data type
  ): Promise<Lease> {
    const existingLease = await this.checkLeaseOrg(id, organizationId);

    // Convert date strings to Date objects if present in data
    const updateData: Partial<NewLease> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.moveInDate)
      updateData.moveInDate = data.moveInDate
        ? new Date(data.moveInDate)
        : null;

    const result = await db
      .update(leaseEntity)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leaseEntity.id, id),
          eq(leaseEntity.organizationId, organizationId)
        )
      )
      .returning();

    // Update unit status based on new lease status if changed
    if (data.status && data.status !== existingLease.status) {
      if (data.status === "active") {
        await db
          .update(unitEntity)
          .set({ status: "occupied", updatedAt: new Date() })
          .where(eq(unitEntity.id, existingLease.unitId));
      } else if (["expired", "terminated"].includes(data.status)) {
        // Check if another active lease exists before setting to vacant
        const otherActiveLease = await db.query.leaseEntity.findFirst({
          where: and(
            eq(leaseEntity.unitId, existingLease.unitId),
            eq(leaseEntity.status, "active"),
            eq(leaseEntity.organizationId, organizationId),
            eq(leaseEntity.id, id)
          ),
        });
        if (!otherActiveLease) {
          await db
            .update(unitEntity)
            .set({ status: "vacant", updatedAt: new Date() })
            .where(eq(unitEntity.id, existingLease.unitId));
        }
      }
    }

    return result[0];
  }

  async deleteLease(id: string, organizationId: string): Promise<void> {
    const existingLease = await this.checkLeaseOrg(id, organizationId);

    // Update unit status to 'vacant' if this was the only active lease
    if (existingLease.status === "active") {
      const otherActiveLease = await db.query.leaseEntity.findFirst({
        where: and(
          eq(leaseEntity.unitId, existingLease.unitId),
          eq(leaseEntity.status, "active"),
          eq(leaseEntity.organizationId, organizationId),
          eq(leaseEntity.id, id)
        ),
      });
      if (!otherActiveLease) {
        await db
          .update(unitEntity)
          .set({ status: "vacant", updatedAt: new Date() })
          .where(eq(unitEntity.id, existingLease.unitId));
      }
    }

    // Deleting the lease might cascade delete lease-tenant assignments based on entity setup
    await db
      .delete(leaseEntity)
      .where(
        and(
          eq(leaseEntity.id, id),
          eq(leaseEntity.organizationId, organizationId)
        )
      );
  }

  // --- Tenant Assignment (delegated to TenantsService, but could live here too) ---
  // Example: assignTenantToLease, removeTenantFromLease ...
}

export const leasesService = new LeasesService();
