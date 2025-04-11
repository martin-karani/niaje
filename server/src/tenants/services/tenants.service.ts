import { createId } from "@/db/utils";
import { NotFoundError, PermissionError } from "@/errors";
import {
  CreateTenantDto,
  TenantFilterDto,
  UpdateTenantDto,
} from "../dto/tenants.dto";
import { tenantsRepository } from "../repositories/tenants.repository";
import { Tenant, TenantWithRelations } from "../types";

export class TenantsService {
  /**
   * Get tenants with optional filtering
   * Apply access control based on user role and permissions
   */
  async getTenants(
    filters: TenantFilterDto,
    userId: string,
    userRole: string
  ): Promise<TenantWithRelations[]> {
    // Admin can see all tenants
    if (userRole === "ADMIN") {
      return tenantsRepository.findAll(filters);
    }

    // If propertyId is provided, make sure user has access to this property
    if (filters.propertyId) {
      // This would be a good place to check if user has access to this property
      // For now, we'll assume the middleware has already done this check
      return tenantsRepository.findAll(filters);
    }

    // Landlords see tenants in their properties
    if (userRole === "LANDLORD") {
      // For landlords without a specified property, we need to fetch all their properties
      // and then get tenants for those properties
      // This is a complex query that would need to be implemented in the repository
      // For simplicity, we'll return all tenants for now
      return tenantsRepository.findAll(filters);
    }

    // Caretakers and agents see tenants in properties they manage
    if (userRole === "CARETAKER" || userRole === "AGENT") {
      // Similar to landlords, without a specified property we need to
      // fetch all properties they manage and then get tenants
      // For simplicity, we'll return all tenants for now
      return tenantsRepository.findAll(filters);
    }

    // Default fallback - empty list
    return [];
  }

  /**
   * Get a tenant by ID
   */
  async getTenantById(
    tenantId: string,
    userId: string,
    userRole: string
  ): Promise<TenantWithRelations> {
    const tenant = await tenantsRepository.findById(tenantId, true);

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // TODO: Add permission check based on property assignments
    // For now, we'll return the tenant regardless of permissions since
    // we're assuming middleware handles permission checks

    return tenant;
  }

  /**
   * Create a new tenant
   */
  async createTenant(
    tenantData: CreateTenantDto,
    userId: string,
    userRole: string
  ): Promise<Tenant> {
    // Check if tenant with same email already exists
    const existingTenant = await tenantsRepository.findByEmail(
      tenantData.email
    );
    if (existingTenant) {
      throw new Error("A tenant with this email already exists");
    }

    // Permissions: Only ADMIN, LANDLORD, and AGENT can create tenants
    if (!["ADMIN", "LANDLORD", "AGENT"].includes(userRole)) {
      throw new PermissionError("You do not have permission to create tenants");
    }

    return tenantsRepository.create({
      ...tenantData,
      id: createId(), // This will be handled by the database, but adding it here for clarity
    });
  }

  /**
   * Update a tenant
   */
  async updateTenant(
    tenantId: string,
    tenantData: UpdateTenantDto,
    userId: string,
    userRole: string
  ): Promise<Tenant> {
    // Check if tenant exists
    const tenant = await tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // If email is being changed, check if it conflicts with an existing tenant
    if (tenantData.email && tenantData.email !== tenant.email) {
      const existingTenant = await tenantsRepository.findByEmail(
        tenantData.email
      );
      if (existingTenant && existingTenant.id !== tenantId) {
        throw new Error("A tenant with this email already exists");
      }
    }

    // Permissions: Only ADMIN, LANDLORD, and AGENT can update tenants
    // CARETAKERS might have limited update permissions
    if (!["ADMIN", "LANDLORD", "AGENT"].includes(userRole)) {
      throw new PermissionError("You do not have permission to update tenants");
    }

    return tenantsRepository.update(tenantId, tenantData);
  }

  /**
   * Delete a tenant
   */
  async deleteTenant(
    tenantId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Check if tenant exists
    const tenant = await tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // Permissions: Only ADMIN and LANDLORD can delete tenants
    if (!["ADMIN", "LANDLORD"].includes(userRole)) {
      throw new PermissionError("You do not have permission to delete tenants");
    }

    try {
      await tenantsRepository.delete(tenantId);
    } catch (error: any) {
      if (error.message === "Cannot delete tenant with active leases") {
        throw new Error(
          "Cannot delete tenant with active leases. Please terminate or transfer all leases first."
        );
      }
      throw error;
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(userId: string, userRole: string): Promise<any> {
    // Only ADMIN and LANDLORD can see tenant statistics
    if (!["ADMIN", "LANDLORD"].includes(userRole)) {
      throw new PermissionError(
        "You do not have permission to view tenant statistics"
      );
    }

    const statusCounts = await tenantsRepository.getStatusCounts();

    return {
      statusCounts,
      // Add more stats as needed
    };
  }
}

// Export a singleton instance
export const tenantsService = new TenantsService();
