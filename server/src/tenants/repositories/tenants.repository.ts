import { db } from "@/db";
import { leases, maintenanceRequests, tenants, units } from "@/db/schema";
import { Tenant, TenantWithRelations } from "@/tenants/types";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  CreateTenantDto,
  TenantFilterDto,
  UpdateTenantDto,
} from "../dto/tenants.dto";

export class TenantsRepository {
  async findAll(filters?: TenantFilterDto): Promise<TenantWithRelations[]> {
    // Build query conditions based on filters
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(tenants.status, filters.status));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(tenants.name, `%${filters.search}%`),
          ilike(tenants.email, `%${filters.search}%`)
        )
      );
    }

    // Handle property filtering
    if (filters?.propertyId) {
      // First, get all unit IDs for the property
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, filters.propertyId),
        columns: { id: true },
      });

      const unitIds = propertyUnits.map((unit) => unit.id);

      if (unitIds.length === 0) {
        // No units found for this property, so there can't be any tenants
        return [];
      }

      // Get all tenant IDs with leases in these units
      const propertyLeases = await db.query.leases.findMany({
        where: inArray(leases.unitId, unitIds),
        columns: { tenantId: true },
      });

      const tenantIds = propertyLeases.map((lease) => lease.tenantId);

      if (tenantIds.length === 0) {
        // No leases found for units in this property
        return [];
      }

      // Add tenant ID filter
      conditions.push(inArray(tenants.id, tenantIds));
    }

    // Execute the query with all conditions
    const result = await db.query.tenants.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [sql`created_at desc`],
    });

    return result;
  }

  /**
   * Find a tenant by ID with optional relations
   */
  async findById(
    id: string,
    includeRelations = false
  ): Promise<TenantWithRelations | null> {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!tenant) return null;

    // If we don't need relations, return early
    if (!includeRelations) return tenant;

    // Fetch related leases with unit and property info
    const tenantLeases = await db.query.leases.findMany({
      where: eq(leases.tenantId, id),
      with: {
        unit: {
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
    });

    // Fetch related maintenance requests
    const tenantMaintenanceRequests =
      await db.query.maintenanceRequests.findMany({
        where: eq(maintenanceRequests.tenantId, id),
        with: {
          unit: {
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
      });

    // Combine everything into a single object
    return {
      ...tenant,
      leases: tenantLeases.map((lease) => ({
        id: lease.id,
        unitId: lease.unitId,
        startDate: lease.startDate,
        endDate: lease.endDate,
        status: lease.status,
        unit: lease.unit
          ? {
              name: lease.unit.name,
              property: lease.unit.property,
            }
          : undefined,
      })),
      maintenanceRequests: tenantMaintenanceRequests.map((request) => ({
        id: request.id,
        title: request.title,
        status: request.status,
        unit: request.unit
          ? {
              name: request.unit.name,
              property: request.unit.property,
            }
          : undefined,
      })),
    };
  }

  /**
   * Find tenants by property ID
   */
  async findByPropertyId(propertyId: string): Promise<Tenant[]> {
    // This requires joining through units and leases
    const query = sql`
      SELECT DISTINCT t.* 
      FROM tenants t
      JOIN leases l ON t.id = l.tenant_id
      JOIN units u ON l.unit_id = u.id
      WHERE u.property_id = ${propertyId}
    `;

    return db.execute(query);
  }

  /**
   * Check if a tenant exists with the given email
   */
  async findByEmail(email: string): Promise<Tenant | null> {
    return db.query.tenants.findFirst({
      where: eq(tenants.email, email),
    });
  }

  /**
   * Create a new tenant
   */
  async create(tenantData: CreateTenantDto): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values({
        ...tenantData,
        updatedAt: new Date(),
      })
      .returning();

    return tenant;
  }

  /**
   * Update a tenant
   */
  async update(
    id: string,
    tenantData: Partial<UpdateTenantDto>
  ): Promise<Tenant> {
    // Remove id from the update data if present
    const { id: _, ...updateData } = tenantData;

    const [tenant] = await db
      .update(tenants)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return tenant;
  }

  /**
   * Delete a tenant
   */
  async delete(id: string): Promise<void> {
    // Check if tenant has active leases
    const activeLeases = await db.query.leases.findMany({
      where: and(eq(leases.tenantId, id), eq(leases.status, "active")),
    });

    if (activeLeases.length > 0) {
      throw new Error("Cannot delete tenant with active leases");
    }

    await db.delete(tenants).where(eq(tenants.id, id));
  }

  /**
   * Count tenants by status
   */
  async getStatusCounts(): Promise<{ status: string; count: number }[]> {
    const result = await db.execute(sql`
      SELECT status, COUNT(*) as count 
      FROM tenants 
      GROUP BY status
    `);

    return result;
  }
}

// Export a singleton instance
export const tenantsRepository = new TenantsRepository();
