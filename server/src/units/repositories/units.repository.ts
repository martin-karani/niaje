import { db } from "@/db";
import { leases, maintenanceRequests, units } from "@/db/schema";
import { UnitFilterDto } from "@/units/dto/units.dto";
import { Unit, UnitStats, UnitWithRelations } from "@/units/types";
import { and, avg, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { CreateUnitDto, UpdateUnitDto } from "../dto/units.dto";

export class UnitsRepository {
  /**
   * Find all units with optional filtering
   */
  async findAll(filters?: UnitFilterDto): Promise<UnitWithRelations[]> {
    // Build the conditions array for filtering
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(eq(units.propertyId, filters.propertyId));
    }

    if (filters?.status) {
      conditions.push(eq(units.status, filters.status));
    }

    if (filters?.minBedrooms !== undefined) {
      conditions.push(gte(units.bedrooms, filters.minBedrooms));
    }

    if (filters?.maxBedrooms !== undefined) {
      conditions.push(lte(units.bedrooms, filters.maxBedrooms));
    }

    if (filters?.minBathrooms !== undefined) {
      conditions.push(gte(units.bathrooms, filters.minBathrooms));
    }

    if (filters?.maxBathrooms !== undefined) {
      conditions.push(lte(units.bathrooms, filters.maxBathrooms));
    }

    if (filters?.minRent !== undefined) {
      conditions.push(gte(units.rent, filters.minRent));
    }

    if (filters?.maxRent !== undefined) {
      conditions.push(lte(units.rent, filters.maxRent));
    }

    if (filters?.minSize !== undefined) {
      conditions.push(gte(units.size, filters.minSize));
    }

    if (filters?.maxSize !== undefined) {
      conditions.push(lte(units.size, filters.maxSize));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(units.name, `%${filters.search}%`),
          ilike(units.type, `%${filters.search}%`)
        )
      );
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Determine sort
    let orderBy;
    if (filters?.sortBy) {
      const sortColumn =
        units[filters.sortBy as keyof typeof units] || units.name;
      orderBy = filters?.sortOrder === "desc" ? desc(sortColumn) : sortColumn;
    } else {
      orderBy = units.name;
    }

    // Execute query with filtering and pagination
    return db.query.units.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        property: {
          columns: {
            id: true,
            name: true,
            address: true,
            ownerId: true,
          },
        },
      },
      orderBy,
      limit,
      offset,
    });
  }

  /**
   * Count units with filters (for pagination)
   */
  async countUnits(
    filters?: Omit<UnitFilterDto, "page" | "limit" | "sortBy" | "sortOrder">
  ): Promise<number> {
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(eq(units.propertyId, filters.propertyId));
    }

    if (filters?.status) {
      conditions.push(eq(units.status, filters.status));
    }

    if (filters?.minBedrooms !== undefined) {
      conditions.push(gte(units.bedrooms, filters.minBedrooms));
    }

    if (filters?.maxBedrooms !== undefined) {
      conditions.push(lte(units.bedrooms, filters.maxBedrooms));
    }

    if (filters?.minBathrooms !== undefined) {
      conditions.push(gte(units.bathrooms, filters.minBathrooms));
    }

    if (filters?.maxBathrooms !== undefined) {
      conditions.push(lte(units.bathrooms, filters.maxBathrooms));
    }

    if (filters?.minRent !== undefined) {
      conditions.push(gte(units.rent, filters.minRent));
    }

    if (filters?.maxRent !== undefined) {
      conditions.push(lte(units.rent, filters.maxRent));
    }

    if (filters?.minSize !== undefined) {
      conditions.push(gte(units.size, filters.minSize));
    }

    if (filters?.maxSize !== undefined) {
      conditions.push(lte(units.size, filters.maxSize));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(units.name, `%${filters.search}%`),
          ilike(units.type, `%${filters.search}%`)
        )
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(units)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a unit by ID with related information
   */
  async findById(
    id: string,
    includeRelations = true
  ): Promise<UnitWithRelations | null> {
    const unit = await db.query.units.findFirst({
      where: eq(units.id, id),
      with: includeRelations
        ? {
            property: {
              columns: {
                id: true,
                name: true,
                address: true,
                ownerId: true,
              },
            },
          }
        : undefined,
    });

    if (!unit) return null;

    // If we want related data, fetch active leases and maintenance requests
    if (includeRelations) {
      // Fetch active leases
      const activeLeases = await db.query.leases.findMany({
        where: and(eq(leases.unitId, id), eq(leases.status, "active")),
        columns: {
          id: true,
          tenantId: true,
          startDate: true,
          endDate: true,
        },
        with: {
          tenant: {
            columns: {
              name: true,
            },
          },
        },
      });

      // Fetch maintenance requests
      const maintenanceRequestsData =
        await db.query.maintenanceRequests.findMany({
          where: eq(maintenanceRequests.unitId, id),
          columns: {
            id: true,
            title: true,
            status: true,
            priority: true,
            reportedAt: true,
          },
          orderBy: [desc(maintenanceRequests.reportedAt)],
          limit: 5, // Get only the most recent requests
        });

      // Add relations to the unit object
      return {
        ...unit,
        activeLeases: activeLeases.map((lease) => ({
          id: lease.id,
          tenantId: lease.tenantId,
          startDate: lease.startDate,
          endDate: lease.endDate,
          tenantName: lease.tenant?.name,
        })),
        maintenanceRequests: maintenanceRequestsData,
      };
    }

    return unit;
  }

  /**
   * Create a new unit
   */
  async create(unitData: CreateUnitDto): Promise<Unit> {
    const [unit] = await db
      .insert(units)
      .values({
        ...unitData,
        updatedAt: new Date(),
      })
      .returning();

    return unit;
  }

  /**
   * Update a unit
   */
  async update(id: string, unitData: Partial<UpdateUnitDto>): Promise<Unit> {
    // Remove id from the update data if present
    const { id: _, ...updateData } = unitData;

    const [unit] = await db
      .update(units)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning();

    return unit;
  }

  /**
   * Delete a unit
   */
  async delete(id: string): Promise<void> {
    // Check if unit has active leases
    const activeLeases = await db.query.leases.findMany({
      where: and(eq(leases.unitId, id), eq(leases.status, "active")),
    });

    if (activeLeases.length > 0) {
      throw new Error("Cannot delete unit with active leases");
    }

    await db.delete(units).where(eq(units.id, id));
  }

  /**
   * Get unit statistics
   */
  async getUnitStats(propertyId?: string): Promise<UnitStats> {
    // Base condition for property filtering
    const propertyCondition = propertyId
      ? eq(units.propertyId, propertyId)
      : undefined;

    // Get total units
    const [totalResult] = await db
      .select({ count: count() })
      .from(units)
      .where(propertyCondition);

    // Get units by status
    const vacantUnits = await this.countUnitsByStatus("vacant", propertyId);
    const occupiedUnits = await this.countUnitsByStatus("occupied", propertyId);
    const maintenanceUnits = await this.countUnitsByStatus(
      "maintenance",
      propertyId
    );
    const reservedUnits = await this.countUnitsByStatus("reserved", propertyId);
    const unavailableUnits = await this.countUnitsByStatus(
      "unavailable",
      propertyId
    );

    // Calculate occupancy rate
    const occupancyRate =
      totalResult.count > 0 ? (occupiedUnits / totalResult.count) * 100 : 0;

    // Get average rent
    const [avgRentResult] = await db
      .select({ avgRent: avg(units.rent) })
      .from(units)
      .where(propertyCondition);

    // Get units grouped by number of bedrooms
    const bedroomsResult = await db
      .select({
        bedrooms: units.bedrooms,
        count: count(),
      })
      .from(units)
      .where(propertyCondition)
      .groupBy(units.bedrooms)
      .orderBy(units.bedrooms);

    // Get units grouped by rent ranges
    const rentRanges = [
      { min: 0, max: 500, label: "0-500" },
      { min: 501, max: 1000, label: "501-1000" },
      { min: 1001, max: 1500, label: "1001-1500" },
      { min: 1501, max: 2000, label: "1501-2000" },
      { min: 2001, max: 3000, label: "2001-3000" },
      { min: 3001, max: null, label: "3001+" },
    ];

    const rentRangeData = await Promise.all(
      rentRanges.map(async (range) => {
        let conditions = [];

        if (propertyCondition) {
          conditions.push(propertyCondition);
        }

        if (range.min !== null) {
          conditions.push(gte(units.rent, range.min));
        }

        if (range.max !== null) {
          conditions.push(lte(units.rent, range.max));
        }

        const [result] = await db
          .select({ count: count() })
          .from(units)
          .where(conditions.length ? and(...conditions) : undefined);

        return {
          range: range.label,
          count: result.count,
        };
      })
    );

    return {
      totalUnits: totalResult.count,
      vacantUnits,
      occupiedUnits,
      maintenanceUnits,
      reservedUnits,
      unavailableUnits,
      averageRent: Number(avgRentResult.avgRent) || 0,
      occupancyRate,
      unitsByBedrooms: bedroomsResult.map((r) => ({
        bedrooms: r.bedrooms,
        count: Number(r.count),
      })),
      unitsByRentRange: rentRangeData,
    };
  }

  /**
   * Helper method to count units by status
   */
  private async countUnitsByStatus(
    status: string,
    propertyId?: string
  ): Promise<number> {
    const conditions = [];

    conditions.push(eq(units.status, status));

    if (propertyId) {
      conditions.push(eq(units.propertyId, propertyId));
    }

    const [result] = await db
      .select({ count: count() })
      .from(units)
      .where(and(...conditions));

    return result.count;
  }

  /**
   * Find vacant units within a property
   */
  async findVacantUnits(propertyId: string): Promise<Unit[]> {
    return db.query.units.findMany({
      where: and(eq(units.propertyId, propertyId), eq(units.status, "vacant")),
    });
  }

  /**
   * Update unit status
   */
  async updateStatus(id: string, status: string): Promise<Unit> {
    const [unit] = await db
      .update(units)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning();

    return unit;
  }
}

// Export a singleton instance
export const unitsRepository = new UnitsRepository();
