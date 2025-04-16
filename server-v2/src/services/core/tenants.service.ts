// src/services/core/tenants.service.ts
import { db } from "@/db";
import { leaseTenants, tenants, user } from "@/db/schema";
import { emailService } from "@/services/system/email.service";
import { generateTemporaryPassword, hashPassword } from "@/utils/auth.utils";
import { and, eq } from "drizzle-orm";

export class TenantsService {
  /**
   * Get tenants by organization
   */
  async getTenantsByOrganization(organizationId: string) {
    return db.query.tenants.findMany({
      where: eq(tenants.organizationId, organizationId),
      with: {
        leaseAssignments: {
          with: {
            lease: {
              with: {
                unit: {
                  with: {
                    property: true,
                  },
                },
              },
            },
          },
        },
        userAccount: true,
      },
    });
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(id: string) {
    return db.query.tenants.findFirst({
      where: eq(tenants.id, id),
      with: {
        leaseAssignments: {
          with: {
            lease: {
              with: {
                unit: {
                  with: {
                    property: true,
                  },
                },
              },
            },
          },
        },
        userAccount: true,
      },
    });
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: {
    organizationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    occupation?: string;
    employer?: string;
    income?: number;
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
    emergencyContactEmail?: string;
    notes?: string;
    createPortalAccess?: boolean;
  }) {
    let userId = null;

    // If portal access requested, create a user account
    if (data.createPortalAccess) {
      // Check if user with this email already exists
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, data.email),
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Generate a temporary password
        const tempPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(tempPassword);

        // Create user
        const newUser = await db
          .insert(user)
          .values({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            passwordHash,
            phone: data.phone,
            role: "tenant_user",
            isActive: true,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        userId = newUser[0].id;

        // Send portal access email
        await emailService.sendTenantPortalCredentials(
          data.email,
          `${data.firstName} ${data.lastName}`,
          tempPassword
        );
      }
    }

    // Create tenant record
    const result = await db
      .insert(tenants)
      .values({
        organizationId: data.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        occupation: data.occupation,
        employer: data.employer,
        income: data.income,
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelation: data.emergencyContactRelation,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactEmail: data.emergencyContactEmail,
        notes: data.notes,
        userId,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Update a tenant
   */
  async updateTenant(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      status: string;
      dateOfBirth: Date;
      occupation: string;
      employer: string;
      income: number;
      emergencyContactName: string;
      emergencyContactRelation: string;
      emergencyContactPhone: string;
      emergencyContactEmail: string;
      notes: string;
    }>
  ) {
    const result = await db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    // If email is updated and user account exists, update that too
    if (data.email) {
      const tenant = result[0];
      if (tenant.userId) {
        await db
          .update(user)
          .set({
            email: data.email,
            name:
              data.firstName && data.lastName
                ? `${data.firstName} ${data.lastName}`
                : undefined,
            phone: data.phone,
            updatedAt: new Date(),
          })
          .where(eq(user.id, tenant.userId));
      }
    }

    return result[0];
  }

  /**
   * Delete a tenant
   */
  async deleteTenant(id: string) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
      columns: {
        userId: true,
      },
    });

    // Delete tenant
    await db.delete(tenants).where(eq(tenants.id, id));

    // If user account exists, we could either delete it or just mark as inactive
    if (tenant?.userId) {
      // Option 1: Delete user account
      // await db.delete(user).where(eq(user.id, tenant.userId));

      // Option 2: Mark as inactive (probably better)
      await db
        .update(user)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(user.id, tenant.userId));
    }

    return true;
  }

  /**
   * Assign tenant to a lease
   */
  async assignTenantToLease(
    tenantId: string,
    leaseId: string,
    isPrimary: boolean = false
  ) {
    // Check if already assigned
    const existing = await db.query.leaseTenants.findFirst({
      where: and(
        eq(leaseTenants.tenantId, tenantId),
        eq(leaseTenants.leaseId, leaseId)
      ),
    });

    if (existing) {
      // Update primary status if different
      if (existing.isPrimary !== isPrimary) {
        return db
          .update(leaseTenants)
          .set({ isPrimary })
          .where(
            and(
              eq(leaseTenants.tenantId, tenantId),
              eq(leaseTenants.leaseId, leaseId)
            )
          )
          .returning();
      }
      return [existing];
    }

    // Create new assignment
    return db
      .insert(leaseTenants)
      .values({
        tenantId,
        leaseId,
        isPrimary,
        createdAt: new Date(),
      })
      .returning();
  }

  /**
   * Remove tenant from lease
   */
  async removeTenantFromLease(tenantId: string, leaseId: string) {
    await db
      .delete(leaseTenants)
      .where(
        and(
          eq(leaseTenants.tenantId, tenantId),
          eq(leaseTenants.leaseId, leaseId)
        )
      );

    return true;
  }
}

export const tenantsService = new TenantsService();
