// src/services/tenant-portal.service.ts
import { db } from "@/db";
import {
    communications,
    leaseTenants,
    leases,
    maintenanceRequests,
    payments,
    tenants
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export class TenantPortalService {
  /**
   * Get tenant profile data
   */
  async getTenantProfile(userId: string) {
    // Find the tenant record linked to this user
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.userId, userId),
      with: {
        organization: true,
        leaseAssignments: {
          with: {
            lease: {
              with: {
                unit: {
                  with: {
                    property: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!tenant) {
      throw new Error("Tenant profile not found");
    }

    return tenant;
  }

  /**
   * Get active lease details for tenant
   */
  async getTenantActiveLeases(userId: string) {
    // First get the tenant
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.userId, userId)
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Find active leases for this tenant
    const tenantLeases = await db.query.leaseTenants.findMany({
      where: eq(leaseTenants.tenantId, tenant.id),
      with: {
        lease: {
          where: eq(leases.status, "active"),
          with: {
            unit: {
              with: {
                property: true
              }
            }
          }
        }
      }
    });

    // Filter out any leaseTenants that don't have an active lease
    return tenantLeases
      .filter(tl => tl.lease !== null)
      .map(tl => tl.lease);
  }

  /**
   * Create maintenance request as tenant
   */
  async createMaintenanceRequest(data: {
    userId: string;
    title: string;
    description: string;
    unitId?: string; // Optional - if not provided, will be derived from active lease
    permissionToEnter?: boolean;
    preferredAvailability?: string;
    priority?: string;
    category?: string;
    imageUrls?: string[]; // Optional images of the issue
  }) {
    // Get tenant record
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.userId, data.userId)
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    let unitId = data.unitId;
    let propertyId: string;

    // If unit ID not provided, get from active lease
    if (!unitId) {
      const activeLease = await db.query.leaseTenants.findFirst({
        where: eq(leaseTenants.tenantId, tenant.id),
        with: {
          lease: {
            where: eq(leases.status, "active")
          }
        }
      });

      if (!activeLease?.lease) {
        throw new Error("No active lease found for tenant");
      }

      unitId = activeLease.lease.unitId;
      propertyId = activeLease.lease.propertyId;
    } else {
      // Get property ID from unit
      const unit = await db.query.units.findFirst({
        where: eq(units.id, unitId),
        columns: {
          propertyId: true
        }
      });

      if (!unit) {
        throw new Error("Unit not found");
      }

      propertyId = unit.propertyId;
    }

    // Create maintenance request
    const result = await db.insert(maintenanceRequests).values({
      organizationId: tenant.organizationId,
      propertyId,
      unitId,
      title: data.title,
      description: data.description,
      status: 'reported',
      priority: data.priority || 'medium',
      category: data.category,
      permissionToEnter: data.permissionToEnter || false,
      preferredAvailability: data.preferredAvailability,
      reportedBy: data.userId, // Link to the tenant's user account
      imagesBefore: data.imageUrls ? JSON.stringify(data.imageUrls) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return result[0];
  }

  /**
   * Get payment history for tenant
   */
  async getTenantPaymentHistory(userId: string) {
    // Get tenant record
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.userId, userId)
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Get payment records
    return db.query.payments.findMany({
      where: eq(payments.tenantId, tenant.id),
      orderBy: [desc(payments.transactionDate)],
      with: {
        lease: true
      }
    });
  }

  /**
   * Create payment for tenant (marked as pending until processed)
   */
  async createPayment(data: {
    userId: string;
    leaseId: string;
    amount: number;
    type: string; // 'rent', 'deposit', etc.
    method: string; // 'card', 'bank_transfer', etc.
    // Other payment fields
  }) {
    // Get tenant record
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.userId, data.userId)
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Verify lease belongs to this tenant
    const leaseTenant = await db.query.leaseTenants.findFirst({
      where: and(
        eq(leaseTenants.tenantId, tenant.id),
        eq(leaseTenants.leaseId, data.leaseId)
      ),
      with: {
        lease: {
          with: {
            unit: {
              with: {
                property: true
              }
            }
          }
        }
      }
    });

    if (!leaseTenant) {
      throw new Error("Lease not found or not associated with tenant");
    }

    // Create payment record
    const result = await db.insert(payments).values({
      organizationId: tenant.organizationId,
      propertyId: leaseTenant.lease.propertyId,
      unitId: leaseTenant.lease.unitId,
      leaseId: data.leaseId,
      tenantId: tenant.id,
      amount: data.amount,
      type: data.type,
      method: data.method,
      status: 'pending', // Will be updated once payment is processed
      transactionDate: new Date(),
      currency: 'KES', // Get from org settings or lease
      description: `${data.type} payment for ${leaseTenant.lease.unit.property.name} - ${leaseTenant.lease.unit.name}`,
      recordedBy: data.userId, // The tenant's user record
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return result[0];
  }

  /**
   * Get maintenance requests for tenant
   */
  async getTenantMaintenanceRequests(userId: string) {
    // Get tenant record
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.userId, userId)
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Get active leases for this tenant to find their units
    const tenantLeases = await db.query.leaseTenants.findMany({
      where: eq(leaseTenants.tenantId, tenant.id),
      with: {
        lease: {
          columns: {
            unitId: true
          }
        }
      }
    });

    const unitIds = tenantLeases
      .filter(tl => tl.lease !== null)
      .map(tl => tl.lease.unitId);

    if (unitIds.length === 0) {
      return []; // No units to check for maintenance
    }

    // Find maintenance requests for tenant's units
    return db.query.maintenanceRequests.findMany({
      where: eq(maintenanceRequests.reportedBy, userId),
      orderBy: [desc(maintenanceRequests.createdAt)],
      with: {
        unit: true,
        property: true,
        assignee: true // Caretaker or staff assigned to fix the issue
      }
    });
  }

  /**
   * Get communications/notifications for tenant
   */
  async getTenantCommunications(userId: string) {
    // Get tenant record
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.userId, userId)
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Get communications for this tenant
    return db.query.communications.findMany({
      where: and(
        eq(communications.recipientTenantId, tenant.id),
        // Or communications sent to their user account
        eq(communications.recipientUserId, userId)
      ),
      orderBy: [desc(communications.createdAt)],
      with: {
        sender: true,
        property: true
      }
    });
  }
}

export const tenantPortalService = new TenantPortalService();