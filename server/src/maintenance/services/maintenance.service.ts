import { createId } from "@/db/utils";
import { ConflictError, NotFoundError, PermissionError } from "@/errors";
import {
  AssignMaintenanceRequestDto,
  CreateMaintenanceCategoryDto,
  CreateMaintenanceCommentDto,
  CreateMaintenanceRequestDto,
  GenerateMaintenanceReportDto,
  MaintenanceRequestFilterDto,
  ResolveMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
} from "../dto/maintenance.dto";
import { maintenanceRepository } from "../repository/maintenance.repository";
import { MaintenanceRequestWithRelations, MaintenanceStats } from "../types";

export class MaintenanceService {
  /**
   * Get maintenance requests with filtering and pagination
   */
  async getMaintenanceRequests(
    filters: MaintenanceRequestFilterDto,
    userId: string,
    userRole: string
  ): Promise<{
    requests: MaintenanceRequestWithRelations[];
    total: number;
    pages: number;
  }> {
    // Check user permissions based on role
    // For simplicity, we're assuming middleware has already filtered access

    const requests = await maintenanceRepository.findAll(filters);
    const total = await maintenanceRepository.countRequests(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { requests, total, pages };
  }

  /**
   * Get a maintenance request by ID
   */
  async getMaintenanceRequestById(
    requestId: string,
    userId: string,
    userRole: string
  ): Promise<MaintenanceRequestWithRelations> {
    const request = await maintenanceRepository.findById(requestId);

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    // Check user permissions based on role
    // For simplicity, we're assuming middleware has already filtered access

    return request;
  }

  /**
   * Create a new maintenance request
   */
  async createMaintenanceRequest(
    requestData: CreateMaintenanceRequestDto,
    userId: string,
    userRole: string
  ): Promise<MaintenanceRequestWithRelations> {
    // All roles can create maintenance requests, but different roles might have different defaults
    const priorityByRole: Record<string, string> = {
      LANDLORD: "high", // Landlords get high priority by default
      ADMIN: "high",
      CARETAKER: "medium", // Caretakers get medium priority by default
      AGENT: "medium",
      // Tenants would get low priority by default, but we don't have a tenant role in the system yet
    };

    // Set priority based on user role if not explicitly provided
    if (!requestData.priority) {
      requestData.priority = priorityByRole[userRole] || "medium";
    }

    try {
      const newRequest = await maintenanceRepository.create({
        ...requestData,
        id: createId(), // This will be handled by the DB, but adding for clarity
      });

      // If it's a caretaker, auto-assign to themselves
      if (userRole === "CARETAKER" && !newRequest.assignedTo) {
        await maintenanceRepository.assign(
          {
            id: newRequest.id,
            assignedTo: userId,
            notes: "Auto-assigned to caretaker who created the request",
          },
          userId
        );

        // Refresh the request with the new assignment
        return maintenanceRepository.findById(
          newRequest.id
        ) as Promise<MaintenanceRequestWithRelations>;
      }

      return newRequest;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update an existing maintenance request
   */
  async updateMaintenanceRequest(
    requestId: string,
    requestData: UpdateMaintenanceRequestDto,
    userId: string,
    userRole: string
  ): Promise<MaintenanceRequestWithRelations> {
    const request = await maintenanceRepository.findById(requestId);

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    // Check if user has permission to update
    // For simplicity, we're assuming middleware has already filtered access

    // Validate status transitions
    if (requestData.status) {
      this.validateStatusTransition(
        request.status,
        requestData.status,
        userRole
      );
    }

    try {
      return await maintenanceRepository.update(requestId, requestData);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Assign a maintenance request to a user
   */
  async assignMaintenanceRequest(
    assignData: AssignMaintenanceRequestDto,
    userId: string,
    userRole: string
  ): Promise<MaintenanceRequestWithRelations> {
    const request = await maintenanceRepository.findById(assignData.id);

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    // Check if user has permission to assign
    if (!["ADMIN", "LANDLORD", "CARETAKER"].includes(userRole)) {
      throw new PermissionError(
        "You don't have permission to assign maintenance requests"
      );
    }

    // Validate that the assigned user exists and has appropriate role
    // This would require checking user database
    // For simplicity, we'll skip this check

    try {
      return await maintenanceRepository.assign(assignData, userId);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Resolve a maintenance request
   */
  async resolveMaintenanceRequest(
    resolveData: ResolveMaintenanceRequestDto,
    userId: string,
    userRole: string
  ): Promise<MaintenanceRequestWithRelations> {
    const request = await maintenanceRepository.findById(resolveData.id);

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    // Check if user has permission to resolve
    if (!["ADMIN", "LANDLORD", "CARETAKER"].includes(userRole)) {
      throw new PermissionError(
        "You don't have permission to resolve maintenance requests"
      );
    }

    // Validate that the request can be resolved (not already completed or closed)
    if (request.status === "completed" || request.status === "closed") {
      throw new ConflictError("This maintenance request is already resolved");
    }

    try {
      return await maintenanceRepository.resolve(resolveData, userId);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Add a comment to a maintenance request
   */
  async addComment(
    commentData: CreateMaintenanceCommentDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    const request = await maintenanceRepository.findById(commentData.requestId);

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    // Check if user has permission to comment
    // For simplicity, we're assuming middleware has already filtered access

    // Set privacy based on role if not explicitly set
    if (commentData.isPrivate === undefined) {
      // By default, internal staff comments are private
      commentData.isPrivate = ["ADMIN", "LANDLORD", "CARETAKER"].includes(
        userRole
      );
    }

    try {
      return await maintenanceRepository.addComment({
        ...commentData,
        userId,
        id: createId(), // This will be handled by the DB, but adding for clarity
      });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Delete a maintenance request
   */
  async deleteMaintenanceRequest(
    requestId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const request = await maintenanceRepository.findById(requestId);

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    // Only admins and landlords can delete requests
    if (!["ADMIN", "LANDLORD"].includes(userRole)) {
      throw new PermissionError(
        "You don't have permission to delete maintenance requests"
      );
    }

    try {
      await maintenanceRepository.delete(requestId);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get maintenance statistics
   */
  async getMaintenanceStats(
    propertyId: string | undefined,
    userId: string,
    userRole: string
  ): Promise<MaintenanceStats> {
    // For property-specific stats, check if user has access to this property
    // This would be implemented with your permission system

    return maintenanceRepository.getStats(propertyId);
  }

  /**
   * Create a new maintenance category
   */
  async createMaintenanceCategory(
    categoryData: CreateMaintenanceCategoryDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    // Only admins and landlords can create categories
    if (!["ADMIN", "LANDLORD"].includes(userRole)) {
      throw new PermissionError(
        "You don't have permission to create maintenance categories"
      );
    }

    try {
      return await maintenanceRepository.createCategory(categoryData);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get all maintenance categories
   */
  async getMaintenanceCategories(): Promise<any[]> {
    return maintenanceRepository.getCategories();
  }

  /**
   * Generate a maintenance report
   */
  async generateMaintenanceReport(
    reportData: GenerateMaintenanceReportDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    // Only certain roles can generate reports
    if (!["ADMIN", "LANDLORD", "CARETAKER"].includes(userRole)) {
      throw new PermissionError(
        "You don't have permission to generate maintenance reports"
      );
    }

    // This would generate a report based on the criteria
    // For simplicity, we'll return some stats
    const stats = await maintenanceRepository.getStats(reportData.propertyId);

    // In a real implementation, you'd format this into a proper report
    // and might offer PDF generation or similar
    return {
      reportType: "Maintenance Report",
      dateRange: {
        from: reportData.dateFrom,
        to: reportData.dateTo,
      },
      groupBy: reportData.groupBy,
      stats,
      generatedBy: userId,
      generatedAt: new Date(),
    };
  }

  /**
   * Helper method to validate status transitions
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    userRole: string
  ): void {
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      open: ["in_progress", "completed", "closed", "cancelled"],
      in_progress: ["completed", "open", "closed", "cancelled"],
      completed: ["closed", "in_progress"], // Can reopen if needed
      closed: ["open"], // Can reopen but rare
      cancelled: ["open"], // Can reopen but rare
    };

    // Check if the transition is valid
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ConflictError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }

    // Additional role-based restrictions
    if (
      (newStatus === "cancelled" || newStatus === "closed") &&
      !["ADMIN", "LANDLORD"].includes(userRole)
    ) {
      throw new PermissionError(
        `Only administrators and landlords can mark requests as ${newStatus}`
      );
    }
  }
}

// Export a singleton instance
export const maintenanceService = new MaintenanceService();
