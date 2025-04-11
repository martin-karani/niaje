import { ConflictError, NotFoundError, PermissionError } from "@/errors";
import { generateLeaseAgreement } from "@/services/document-generator";
import {
  CreateLeaseDto,
  LeaseFilterDto,
  RenewLeaseDto,
  TerminateLeaseDto,
  UpdateLeaseDto,
} from "../dto/leases.dto";
import { leasesRepository } from "../repositories/leases.repository";
import { Lease, LeaseStats, LeaseWithRelations } from "../types";

export class LeasesService {
  /**
   * Get leases with filtering and pagination
   */
  async getLeases(
    filters: LeaseFilterDto,
    userId: string,
    userRole: string
  ): Promise<{ leases: LeaseWithRelations[]; total: number; pages: number }> {
    // Check user permissions based on role
    // For simplicity, we're assuming middleware has already filtered access

    const leases = await leasesRepository.findAll(filters);
    const total = await leasesRepository.countLeases(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { leases, total, pages };
  }

  /**
   * Get a lease by ID
   */
  async getLeaseById(
    leaseId: string,
    withTransactions = false,
    userId: string,
    userRole: string
  ): Promise<LeaseWithRelations> {
    const lease = await leasesRepository.findById(leaseId, withTransactions);

    if (!lease) {
      throw new NotFoundError("Lease not found");
    }

    // Check user permissions based on role
    // For simplicity, we're assuming middleware has already filtered access

    return lease;
  }

  /**
   * Create a new lease
   */
  async createLease(
    leaseData: CreateLeaseDto,
    userId: string,
    userRole: string
  ): Promise<Lease> {
    // Only certain roles can create leases
    if (!["ADMIN", "LANDLORD", "AGENT"].includes(userRole)) {
      throw new PermissionError("You don't have permission to create leases");
    }

    try {
      const newLease = await leasesRepository.create({
        ...leaseData,
        createdBy: userId,
      });

      // If successful, generate a lease document
      try {
        const documentUrl = await generateLeaseAgreement(newLease.id);

        // Update the lease with the document URL
        await leasesRepository.update(newLease.id, {
          documentUrl,
        });
      } catch (docError) {
        // If document generation fails, just log the error but don't fail the lease creation
        console.error("Failed to generate lease document:", docError);
      }

      return newLease;
    } catch (error: any) {
      if (error.message.includes("already has an active lease")) {
        throw new ConflictError(error.message);
      }
      if (error.message.includes("not available")) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Update an existing lease
   */
  async updateLease(
    leaseId: string,
    leaseData: UpdateLeaseDto,
    userId: string,
    userRole: string
  ): Promise<Lease> {
    // Only certain roles can update leases
    if (!["ADMIN", "LANDLORD", "AGENT"].includes(userRole)) {
      throw new PermissionError("You don't have permission to update leases");
    }

    const lease = await leasesRepository.findById(leaseId);

    if (!lease) {
      throw new NotFoundError("Lease not found");
    }

    try {
      return await leasesRepository.update(leaseId, leaseData);
    } catch (error: any) {
      if (error.message.includes("already has an active lease")) {
        throw new ConflictError(error.message);
      }
      if (error.message.includes("not available")) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Terminate a lease
   */
  async terminateLease(
    terminateData: TerminateLeaseDto,
    userId: string,
    userRole: string
  ): Promise<Lease> {
    // Only certain roles can terminate leases
    if (!["ADMIN", "LANDLORD"].includes(userRole)) {
      throw new PermissionError(
        "You don't have permission to terminate leases"
      );
    }

    try {
      return await leasesRepository.terminate(
        terminateData.id,
        terminateData.terminationDate,
        terminateData.terminationReason,
        terminateData.refundAmount
      );
    } catch (error: any) {
      if (error.message === "Lease not found") {
        throw new NotFoundError(error.message);
      }
      if (error.message === "Only active leases can be terminated") {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Renew a lease
   */
  async renewLease(
    renewData: RenewLeaseDto,
    userId: string,
    userRole: string
  ): Promise<Lease> {
    // Only certain roles can renew leases
    if (!["ADMIN", "LANDLORD", "AGENT"].includes(userRole)) {
      throw new PermissionError("You don't have permission to renew leases");
    }

    try {
      const newLease = await leasesRepository.renew(
        renewData.id,
        renewData.newEndDate,
        renewData.newRentAmount,
        renewData.preserveDeposit,
        renewData.newDepositAmount
      );

      // If requested, generate a lease document
      if (renewData.generateDocument) {
        try {
          const documentUrl = await generateLeaseAgreement(newLease.id);

          // Update the lease with the document URL
          await leasesRepository.update(newLease.id, {
            documentUrl,
          });
        } catch (docError) {
          // If document generation fails, just log the error but don't fail the renewal
          console.error("Failed to generate lease document:", docError);
        }
      }

      return newLease;
    } catch (error: any) {
      if (error.message === "Lease not found") {
        throw new NotFoundError(error.message);
      }
      if (error.message === "Only active leases can be renewed") {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Delete a lease (use with caution)
   */
  async deleteLease(
    leaseId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Only admins can delete leases
    if (userRole !== "ADMIN") {
      throw new PermissionError("Only administrators can delete leases");
    }

    try {
      await leasesRepository.delete(leaseId);
    } catch (error: any) {
      if (error.message === "Lease not found") {
        throw new NotFoundError(error.message);
      }
      if (error.message.includes("Cannot delete lease with associated")) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Get leases statistics
   */
  async getLeaseStats(
    propertyId: string | undefined,
    userId: string,
    userRole: string
  ): Promise<LeaseStats> {
    // For property-specific stats, check if user has access to this property
    // This would be implemented with your permission system

    return leasesRepository.getLeaseStats(propertyId);
  }

  /**
   * Get leases expiring soon
   */
  async getExpiringLeases(
    daysAhead: number,
    userId: string,
    userRole: string
  ): Promise<LeaseWithRelations[]> {
    // Filter by properties the user has access to if not admin
    // For simplicity, we'll skip this filtering here and assume middleware handles it

    return leasesRepository.findExpiringLeases(daysAhead);
  }

  /**
   * Get leases by tenant ID
   */
  async getLeasesByTenant(
    tenantId: string,
    userId: string,
    userRole: string
  ): Promise<LeaseWithRelations[]> {
    // Check if user has access to this tenant's data
    // This would be implemented with your permission system

    return leasesRepository.findByTenantId(tenantId);
  }

  /**
   * Get leases by unit ID
   */
  async getLeasesByUnit(
    unitId: string,
    userId: string,
    userRole: string
  ): Promise<LeaseWithRelations[]> {
    // Check if user has access to this unit's data
    // This would be implemented with your permission system

    return leasesRepository.findByUnitId(unitId);
  }

  /**
   * Get active lease for a unit
   */
  async getActiveLeaseForUnit(
    unitId: string,
    userId: string,
    userRole: string
  ): Promise<LeaseWithRelations | null> {
    // Check if user has access to this unit's data
    // This would be implemented with your permission system

    return leasesRepository.findActiveLeaseForUnit(unitId);
  }
}

// Export a singleton instance
export const leasesService = new LeasesService();
