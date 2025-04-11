import { db } from "@/db";
import {
  leases,
  tenants,
  transactions,
  units,
  utilityBills,
} from "@/db/schema";
import { LeaseFilterDto } from "@/leases/dto/leases.dto";
import { Lease, LeaseStats, LeaseWithRelations } from "@/leases/types";
import {
  and,
  avg,
  between,
  count,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  sum,
} from "drizzle-orm";
import { CreateLeaseDto, UpdateLeaseDto } from "../dto/leases.dto";

export class LeasesRepository {
  /**
   * Find all leases with filtering and pagination
   */
  async findAll(filters?: LeaseFilterDto): Promise<LeaseWithRelations[]> {
    // Build the base query
    let query = db.query.leases;

    // Build the conditions array for filtering
    const conditions = [];

    // Apply property ID filter (requires joining through units)
    if (filters?.propertyId) {
      conditions.push(
        eq(
          leases.unitId,
          db
            .select({ id: units.id })
            .from(units)
            .where(eq(units.propertyId, filters.propertyId))
            .limit(1)
        )
      );
    }

    // Apply unit ID filter
    if (filters?.unitId) {
      conditions.push(eq(leases.unitId, filters.unitId));
    }

    // Apply tenant ID filter
    if (filters?.tenantId) {
      conditions.push(eq(leases.tenantId, filters.tenantId));
    }

    // Apply status filter
    if (filters?.status) {
      conditions.push(eq(leases.status, filters.status));
    }

    // Apply date range filters
    if (filters?.startDateFrom) {
      conditions.push(gte(leases.startDate, filters.startDateFrom));
    }

    if (filters?.startDateTo) {
      conditions.push(lte(leases.startDate, filters.startDateTo));
    }

    if (filters?.endDateFrom) {
      conditions.push(gte(leases.endDate, filters.endDateFrom));
    }

    if (filters?.endDateTo) {
      conditions.push(lte(leases.endDate, filters.endDateTo));
    }

    // Apply search filter (search in tenant and unit names)
    if (filters?.search) {
      // This is complex and might require raw SQL based on your DB
      // Since we can't directly search on joined tables easily,
      // we'll use a subquery approach or you may need to use raw SQL
      const searchTenantIds = db
        .select({ id: tenants.id })
        .from(tenants)
        .where(ilike(tenants.name, `%${filters.search}%`));

      const searchUnitIds = db
        .select({ id: units.id })
        .from(units)
        .where(ilike(units.name, `%${filters.search}%`));

      conditions.push(
        or(
          eq(leases.tenantId, searchTenantIds.limit(1)),
          eq(leases.unitId, searchUnitIds.limit(1))
        )
      );
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Execute the query with all conditions and pagination
    const result = await query.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          columns: {
            id: true,
            name: true,
            type: true,
          },
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        creator: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [sql`created_at desc`],
      limit,
      offset,
    });

    return result;
  }

  /**
   * Count leases with filters (for pagination)
   */
  async countLeases(
    filters?: Omit<LeaseFilterDto, "page" | "limit">
  ): Promise<number> {
    // Similar filtering logic as findAll, but just return the count
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(
        eq(
          leases.unitId,
          db
            .select({ id: units.id })
            .from(units)
            .where(eq(units.propertyId, filters.propertyId))
            .limit(1)
        )
      );
    }

    if (filters?.unitId) {
      conditions.push(eq(leases.unitId, filters.unitId));
    }

    if (filters?.tenantId) {
      conditions.push(eq(leases.tenantId, filters.tenantId));
    }

    if (filters?.status) {
      conditions.push(eq(leases.status, filters.status));
    }

    if (filters?.startDateFrom) {
      conditions.push(gte(leases.startDate, filters.startDateFrom));
    }

    if (filters?.startDateTo) {
      conditions.push(lte(leases.startDate, filters.startDateTo));
    }

    if (filters?.endDateFrom) {
      conditions.push(gte(leases.endDate, filters.endDateFrom));
    }

    if (filters?.endDateTo) {
      conditions.push(lte(leases.endDate, filters.endDateTo));
    }

    if (filters?.search) {
      const searchTenantIds = db
        .select({ id: tenants.id })
        .from(tenants)
        .where(ilike(tenants.name, `%${filters.search}%`));

      const searchUnitIds = db
        .select({ id: units.id })
        .from(units)
        .where(ilike(units.name, `%${filters.search}%`));

      conditions.push(
        or(
          eq(leases.tenantId, searchTenantIds.limit(1)),
          eq(leases.unitId, searchUnitIds.limit(1))
        )
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(leases)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a lease by ID with related data
   */
  async findById(
    id: string,
    withTransactions = false
  ): Promise<LeaseWithRelations | null> {
    const lease = await db.query.leases.findFirst({
      where: eq(leases.id, id),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          columns: {
            id: true,
            name: true,
            type: true,
          },
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        creator: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lease) return null;

    // If transactions are requested, fetch them
    if (withTransactions) {
      const leaseTransactions = await db.query.transactions.findMany({
        where: eq(transactions.leaseId, id),
        columns: {
          id: true,
          amount: true,
          type: true,
          status: true,
          paymentDate: true,
          dueDate: true,
        },
        orderBy: [sql`payment_date desc`],
      });

      const leaseUtilityBills = await db.query.utilityBills.findMany({
        where: eq(utilityBills.leaseId, id),
        columns: {
          id: true,
          utilityType: true,
          amount: true,
          dueDate: true,
          isPaid: true,
        },
        orderBy: [sql`due_date desc`],
      });

      return {
        ...lease,
        transactions: leaseTransactions,
        utilityBills: leaseUtilityBills,
      };
    }

    return lease;
  }

  /**
   * Find leases for a specific unit
   */
  async findByUnitId(unitId: string): Promise<LeaseWithRelations[]> {
    return db.query.leases.findMany({
      where: eq(leases.unitId, unitId),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [sql`created_at desc`],
    });
  }

  /**
   * Find active lease for a specific unit
   */
  async findActiveLeaseForUnit(
    unitId: string
  ): Promise<LeaseWithRelations | null> {
    return db.query.leases.findFirst({
      where: and(eq(leases.unitId, unitId), eq(leases.status, "active")),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find leases for a specific tenant
   */
  async findByTenantId(tenantId: string): Promise<LeaseWithRelations[]> {
    return db.query.leases.findMany({
      where: eq(leases.tenantId, tenantId),
      with: {
        unit: {
          columns: {
            id: true,
            name: true,
            type: true,
          },
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: [sql`created_at desc`],
    });
  }

  /**
   * Find active lease for a specific tenant
   */
  async findActiveLeaseForTenant(
    tenantId: string
  ): Promise<LeaseWithRelations | null> {
    return db.query.leases.findFirst({
      where: and(eq(leases.tenantId, tenantId), eq(leases.status, "active")),
      with: {
        unit: {
          columns: {
            id: true,
            name: true,
            type: true,
          },
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find leases for a specific property
   */
  async findByPropertyId(propertyId: string): Promise<LeaseWithRelations[]> {
    // Get all units for the property
    const propertyUnits = await db.query.units.findMany({
      where: eq(units.propertyId, propertyId),
      columns: {
        id: true,
      },
    });

    // Get leases for these units
    const unitIds = propertyUnits.map((unit) => unit.id);

    if (unitIds.length === 0) {
      return [];
    }

    return db.query.leases.findMany({
      where: eq(leases.unitId, unitIds),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        unit: {
          columns: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [sql`created_at desc`],
    });
  }

  /**
   * Find expiring leases in the next X days
   */
  async findExpiringLeases(daysAhead: number): Promise<LeaseWithRelations[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return db.query.leases.findMany({
      where: and(
        eq(leases.status, "active"),
        between(leases.endDate, today, futureDate)
      ),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          columns: {
            id: true,
            name: true,
          },
          with: {
            property: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [sql`end_date asc`],
    });
  }

  /**
   * Create a new lease
   */
  async create(
    leaseData: CreateLeaseDto & { createdBy: string }
  ): Promise<Lease> {
    // Check if there's already an active lease for this unit
    const existingActiveLease = await this.findActiveLeaseForUnit(
      leaseData.unitId
    );

    if (existingActiveLease) {
      throw new Error("This unit already has an active lease");
    }

    // Check if the unit exists and is available
    const unit = await db.query.units.findFirst({
      where: eq(units.id, leaseData.unitId),
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    if (unit.status !== "vacant" && unit.status !== "available") {
      throw new Error("Unit is not available for lease");
    }

    // Create the lease
    const [lease] = await db
      .insert(leases)
      .values({
        ...leaseData,
        updatedAt: new Date(),
      })
      .returning();

    // Update unit status to occupied
    await db
      .update(units)
      .set({
        status: "occupied",
        updatedAt: new Date(),
      })
      .where(eq(units.id, leaseData.unitId));

    return lease;
  }

  /**
   * Update an existing lease
   */
  async update(id: string, leaseData: Partial<UpdateLeaseDto>): Promise<Lease> {
    // Remove id from the update data if present
    const { id: _, ...updateData } = leaseData;

    // If changing unit ID, need to check if the new unit is available
    if (updateData.unitId) {
      const existingLease = await this.findById(id);

      if (!existingLease) {
        throw new Error("Lease not found");
      }

      // If changing to a different unit
      if (updateData.unitId !== existingLease.unitId) {
        // Check if the new unit is available
        const newUnit = await db.query.units.findFirst({
          where: eq(units.id, updateData.unitId),
        });

        if (!newUnit) {
          throw new Error("New unit not found");
        }

        if (newUnit.status !== "vacant" && newUnit.status !== "available") {
          throw new Error("New unit is not available for lease");
        }

        // Check if new unit already has an active lease
        const existingActiveLease = await this.findActiveLeaseForUnit(
          updateData.unitId
        );

        if (existingActiveLease) {
          throw new Error("New unit already has an active lease");
        }

        // Update the old unit's status to vacant
        await db
          .update(units)
          .set({
            status: "vacant",
            updatedAt: new Date(),
          })
          .where(eq(units.id, existingLease.unitId));

        // Update the new unit's status to occupied
        await db
          .update(units)
          .set({
            status: "occupied",
            updatedAt: new Date(),
          })
          .where(eq(units.id, updateData.unitId));
      }
    }

    // If changing status to terminated, ensure unit is marked as vacant
    if (updateData.status === "terminated" || updateData.status === "expired") {
      const existingLease = await this.findById(id);

      if (existingLease) {
        await db
          .update(units)
          .set({
            status: "vacant",
            updatedAt: new Date(),
          })
          .where(eq(units.id, existingLease.unitId));
      }
    }

    const [lease] = await db
      .update(leases)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(leases.id, id))
      .returning();

    return lease;
  }

  /**
   * Terminate a lease
   */
  async terminate(
    id: string,
    terminationDate: Date,
    reason: string,
    refundAmount?: number
  ): Promise<Lease> {
    const lease = await this.findById(id);

    if (!lease) {
      throw new Error("Lease not found");
    }

    if (lease.status !== "active") {
      throw new Error("Only active leases can be terminated");
    }

    // Update lease status to terminated
    const [updatedLease] = await db
      .update(leases)
      .set({
        status: "terminated",
        endDate: terminationDate,
        notes: lease.notes
          ? `${lease.notes}\n\nTermination reason: ${reason}`
          : `Termination reason: ${reason}`,
        updatedAt: new Date(),
      })
      .where(eq(leases.id, id))
      .returning();

    // Update unit status to vacant
    await db
      .update(units)
      .set({
        status: "vacant",
        updatedAt: new Date(),
      })
      .where(eq(units.id, lease.unitId));

    // If refund amount is specified, create a refund transaction
    if (refundAmount && refundAmount > 0) {
      await db.insert(transactions).values({
        leaseId: id,
        amount: refundAmount,
        type: "refund",
        status: "completed",
        paymentMethod: "bank_transfer", // Default, can be customized
        paymentDate: new Date(),
        notes: `Refund for lease termination: ${reason}`,
      });
    }

    return updatedLease;
  }

  /**
   * Renew a lease
   */
  async renew(
    id: string,
    newEndDate: Date,
    newRentAmount?: number,
    preserveDeposit = true,
    newDepositAmount?: number
  ): Promise<Lease> {
    const lease = await this.findById(id);

    if (!lease) {
      throw new Error("Lease not found");
    }

    if (lease.status !== "active") {
      throw new Error("Only active leases can be renewed");
    }

    // Create a new lease based on the existing one
    const [newLease] = await db
      .insert(leases)
      .values({
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        startDate: lease.endDate, // Start from when the current lease ends
        endDate: newEndDate,
        rentAmount: newRentAmount || lease.rentAmount,
        depositAmount: preserveDeposit
          ? lease.depositAmount
          : newDepositAmount || lease.depositAmount,
        status: "active",
        paymentDay: lease.paymentDay,
        paymentFrequency: lease.paymentFrequency,
        includesWater: lease.includesWater,
        includesElectricity: lease.includesElectricity,
        includesGas: lease.includesGas,
        includesInternet: lease.includesInternet,
        waterBillingType: lease.waterBillingType,
        electricityBillingType: lease.electricityBillingType,
        gasBillingType: lease.gasBillingType,
        internetBillingType: lease.internetBillingType,
        waterFixedAmount: lease.waterFixedAmount,
        electricityFixedAmount: lease.electricityFixedAmount,
        gasFixedAmount: lease.gasFixedAmount,
        internetFixedAmount: lease.internetFixedAmount,
        createdBy: lease.createdBy,
        notes: lease.notes
          ? `${lease.notes}\n\nRenewed from lease ${id}`
          : `Renewed from lease ${id}`,
      })
      .returning();

    // Update the original lease status to "renewed"
    await db
      .update(leases)
      .set({
        status: "renewed",
        notes: lease.notes
          ? `${lease.notes}\n\nRenewed to lease ${newLease.id}`
          : `Renewed to lease ${newLease.id}`,
        updatedAt: new Date(),
      })
      .where(eq(leases.id, id));

    return newLease;
  }

  /**
   * Delete a lease (use with caution, typically leases should be terminated not deleted)
   */
  async delete(id: string): Promise<void> {
    const lease = await this.findById(id);

    if (!lease) {
      throw new Error("Lease not found");
    }

    // Check for related transactions/bills first
    const hasTransactions = await db.query.transactions.findFirst({
      where: eq(transactions.leaseId, id),
    });

    if (hasTransactions) {
      throw new Error("Cannot delete lease with associated transactions");
    }

    const hasUtilityBills = await db.query.utilityBills.findFirst({
      where: eq(utilityBills.leaseId, id),
    });

    if (hasUtilityBills) {
      throw new Error("Cannot delete lease with associated utility bills");
    }

    // Update unit status to vacant if the lease was active
    if (lease.status === "active") {
      await db
        .update(units)
        .set({
          status: "vacant",
          updatedAt: new Date(),
        })
        .where(eq(units.id, lease.unitId));
    }

    // Delete the lease
    await db.delete(leases).where(eq(leases.id, id));
  }

  /**
   * Get lease statistics
   */
  async getLeaseStats(propertyId?: string): Promise<LeaseStats> {
    let baseQuery = db.select().from(leases);
    let queryConditions = [];

    // If property ID is provided, limit stats to that property
    if (propertyId) {
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, propertyId),
        columns: {
          id: true,
        },
      });

      const unitIds = propertyUnits.map((unit) => unit.id);

      if (unitIds.length > 0) {
        queryConditions.push(eq(leases.unitId, unitIds));
      } else {
        // No units found for this property, return empty stats
        return {
          totalLeases: 0,
          activeLeases: 0,
          expiringNext30Days: 0,
          leasesByStatus: [],
          averageRent: 0,
          totalMonthlyRent: 0,
        };
      }
    }

    // Get total leases
    const [totalResult] = await db
      .select({ count: count() })
      .from(leases)
      .where(queryConditions.length ? and(...queryConditions) : undefined);

    // Get active leases
    const activeConditions = [...queryConditions, eq(leases.status, "active")];
    const [activeResult] = await db
      .select({ count: count() })
      .from(leases)
      .where(activeConditions.length ? and(...activeConditions) : undefined);

    // Get leases expiring in the next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const expiringConditions = [
      ...queryConditions,
      eq(leases.status, "active"),
      between(leases.endDate, today, thirtyDaysLater),
    ];

    const [expiringResult] = await db
      .select({ count: count() })
      .from(leases)
      .where(
        expiringConditions.length ? and(...expiringConditions) : undefined
      );

    // Get leases by status
    const statusCountsResult = await db
      .select({
        status: leases.status,
        count: count(),
      })
      .from(leases)
      .where(queryConditions.length ? and(...queryConditions) : undefined)
      .groupBy(leases.status);

    // Get average rent for active leases
    const [avgRentResult] = await db
      .select({
        avgRent: avg(leases.rentAmount),
      })
      .from(leases)
      .where(and(...activeConditions));

    // Get total monthly rent for active leases
    const [totalRentResult] = await db
      .select({
        totalRent: sum(leases.rentAmount),
      })
      .from(leases)
      .where(
        and(
          ...activeConditions,
          eq(leases.paymentFrequency, "monthly") // Only include monthly leases
        )
      );

    return {
      totalLeases: totalResult.count,
      activeLeases: activeResult.count,
      expiringNext30Days: expiringResult.count,
      leasesByStatus: statusCountsResult.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      averageRent: avgRentResult.avgRent || 0,
      totalMonthlyRent: totalRentResult.totalRent || 0,
    };
  }
}

// Export a singleton instance
export const leasesRepository = new LeasesRepository();
