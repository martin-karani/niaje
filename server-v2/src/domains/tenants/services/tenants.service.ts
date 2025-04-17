import { db } from "@infrastructure/database"; // Adjusted path
import { NotFoundError } from "@shared/errors/not-found.error"; // Adjusted path
import { and, eq } from "drizzle-orm";
import {
  LeaseTenant,
  NewLeaseTenant,
  leaseTenantsEntity,
} from "../entities/lease-tenant.entity";
import { NewTenant, Tenant, tenantEntity } from "../entities/tenant.entity";

export class TenantsService {
  async getTenantsByOrganization(organizationId: string): Promise<Tenant[]> {
    return db.query.tenantEntity.findMany({
      where: eq(tenantEntity.organizationId, organizationId),
      with: {
        userAccount: true, // Include linked user account if needed
      },
    });
  }

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await db.query.tenantEntity.findFirst({
      where: eq(tenantEntity.id, id),
      with: {
        userAccount: true,
        leaseAssignments: {
          // Include lease assignments
          with: {
            lease: true, // And the lease details within assignments
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async createTenant(data: NewTenant): Promise<Tenant> {
    // Add validation or transformation if needed (e.g., date strings to Date objects)
    const result = await db
      .insert(tenantEntity)
      .values({
        ...data,
        // Ensure createdAt/updatedAt are handled if not defaulted in entity
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async updateTenant(
    id: string,
    data: Partial<Omit<NewTenant, "id" | "organizationId">>
  ): Promise<Tenant> {
    await this.getTenantById(id); // Check if tenant exists

    const result = await db
      .update(tenantEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenantEntity.id, id))
      .returning();

    return result[0];
  }

  async deleteTenant(id: string): Promise<void> {
    await this.getTenantById(id); // Check if tenant exists

    // Consider implications: Should deleting a tenant remove them from leases?
    // The cascade on leaseTenants might handle this if set up.
    // Or handle cleanup logic here.
    await db.delete(tenantEntity).where(eq(tenantEntity.id, id));
  }

  // --- Lease Tenant Assignment ---

  async assignTenantToLease(data: NewLeaseTenant): Promise<LeaseTenant> {
    // Check if lease and tenant exist and belong to the same organization
    // Add checks here...

    const result = await db
      .insert(leaseTenantsEntity)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async removeTenantFromLease(
    leaseId: string,
    tenantId: string
  ): Promise<void> {
    await db
      .delete(leaseTenantsEntity)
      .where(
        and(
          eq(leaseTenantsEntity.leaseId, leaseId),
          eq(leaseTenantsEntity.tenantId, tenantId)
        )
      );
  }

  async getTenantsForLease(leaseId: string): Promise<Tenant[]> {
    const assignments = await db.query.leaseTenantsEntity.findMany({
      where: eq(leaseTenantsEntity.leaseId, leaseId),
      with: {
        tenant: true, // Fetch the full tenant record
      },
    });
    return assignments.map((a) => a.tenant);
  }
}

export const tenantsService = new TenantsService();
