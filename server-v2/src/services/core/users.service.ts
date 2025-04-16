// src/services/users.service.ts
import { db } from "@/db";
import { tenants, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  // ... existing methods ...

  /**
   * Create tenant user for portal access
   */
  async createTenantUser(data: {
    email: string;
    name: string;
    phone?: string;
    tenantId: string; // Link to existing tenant record
    // Other user fields
  }) {
    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, data.email)
    });

    let userId;

    if (existingUser) {
      // If user exists but with a different role, that's OK - we can have a user be both
      // a tenant_user and some other role if needed (although rare in practice)
      userId = existingUser.id;
    } else {
      // Create new tenant user
      const result = await db.insert(user).values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'tenant_user',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      userId = result[0].id;
    }

    // Link this user to the tenant record
    await db.update(tenants)
      .set({ 
        userId: userId,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, data.tenantId));

    return db.query.user.findFirst({
      where: eq(user.id, userId)
    });
  }

  /**
   * Get tenants by organization for tenant portal access
   */
  async getTenantsByOrganization(organizationId: string) {
    return db.query.tenants.findMany({
      where: eq(tenants.organizationId, organizationId),
      with: {
        userAccount: true, // Include linked user account if exists
        leaseAssignments: {
          with: {
            lease: true
          }
        }
      }
    });
  }
}

export const usersService = new UsersService();