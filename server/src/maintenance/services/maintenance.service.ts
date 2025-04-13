import { createId } from "@/db/utils";
import { ConflictError, NotFoundError, PermissionError } from "@/errors";
import {
  AssignMaintenanceRequestDto,
  CreateMaintenanceCategoryDto,
  CreateMaintenanceCommentDto,
  CreateMaintenanceRequestDto,
  CreateWorkOrderDto,
  GenerateMaintenanceReportDto,
  MaintenanceRequestFilterDto,
  ResolveMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  WorkOrderFilterDto,
} from "../dto/maintenance.dto";
import { activitiesRepository } from "../repository/activities.repository";
import { maintenanceRepository } from "../repository/maintenance.repository";
import {
  MaintenanceRequestWithRelations,
  MaintenanceStats,
  WorkOrderWithRelations,
} from "../types";

export class MaintenanceService {
  constructor(
    private readonly maintenanceRepository: MaintenanceRepository,
    private readonly activitiesRepository: ActivitiesRepository
  ) {}

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

    const requests = await this.maintenanceRepository.findAll(filters);
    const total = await this.maintenanceRepository.countRequests(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { requests, total, pages };
  }

  /**
   * Get work orders with filtering and pagination
   */
  async getWorkOrders(
    filters: WorkOrderFilterDto,
    userId: string,
    userRole: string
  ): Promise<{
    workOrders: WorkOrderWithRelations[];
    total: number;
    pages: number;
  }> {
    // Check permissions
    // ...

    const workOrders = await this.maintenanceRepository.findAllWorkOrders(
      filters
    );
    const total = await this.maintenanceRepository.countWorkOrders(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { workOrders, total, pages };
  }

  /**
   * Get a maintenance request by ID
   */
  async getMaintenanceRequestById(
    requestId: string,
    userId: string,
    userRole: string
  ): Promise<MaintenanceRequestWithRelations> {
    const request = await this.maintenanceRepository.findById(requestId);

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    // Check user permissions based on role
    // For simplicity, we're assuming middleware has already filtered access

    return request;
  }

  /**
   * Get a work order by ID
   */
  async getWorkOrderById(
    workOrderId: string,
    userId: string,
    userRole: string
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.maintenanceRepository.findWorkOrderById(
      workOrderId
    );

    if (!workOrder) {
      throw new NotFoundError("Work order not found");
    }

    // Check permissions
    // ...

    return workOrder;
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
      const newRequest = await this.maintenanceRepository.create({
        ...requestData,
        id: createId(), // This will be handled by the DB, but adding for clarity
      });

      // Record creation activity
      await this.activitiesRepository.recordActivity({
        userId,
        action: "created_request",
        entityType: "maintenance_request",
        entityId: newRequest.id,
        unitId: newRequest.unitId,
      });

      // If it's a caretaker, auto-assign to themselves
      if (userRole === "CARETAKER" && !newRequest.assignedTo) {
        await this.maintenanceRepository.assign(
          {
            id: newRequest.id,
            assignedTo: userId,
            notes: "Auto-assigned to caretaker who created the request",
          },
          userId
        );

        // Refresh the request with the new assignment
        return this.maintenanceRepository.findById(
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
    const request = await this.maintenanceRepository.findById(requestId);

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
      return await this.maintenanceRepository.update(
        requestId,
        requestData,
        userId
      );
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Push a maintenance request to work order queue
   */
  async pushToWorkOrderQueue(
    requestId: string,
    userId: string,
    workOrderData: Partial<CreateWorkOrderDto> = {}
  ): Promise<WorkOrderWithRelations> {
    try {
      return await this.maintenanceRepository.createWorkOrderFromRequest(
        requestId,
        userId,
        workOrderData
      );
    } catch (error: any) {
      if (error.message === "Maintenance request not found") {
        throw new NotFoundError(error.message);
      }
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
    const request = await this.maintenanceRepository.findById(assignData.id);

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
      return await this.maintenanceRepository.assign(assignData, userId);
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
    const request = await this.maintenanceRepository.findById(resolveData.id);

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
      return await this.maintenanceRepository.resolve(resolveData, userId);
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
    const request = await this.maintenanceRepository.findById(
      commentData.requestId
    );

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
      const comment = await this.maintenanceRepository.addComment({
        ...commentData,
        userId,
        id: createId(), // This will be handled by the DB, but adding for clarity
      });

      // Record comment activity
      await this.activitiesRepository.recordActivity({
        userId,
        action: "added_comment",
        entityType: "maintenance_request",
        entityId: commentData.requestId,
        unitId: request.unitId,
      });

      return comment;
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
    const request = await this.maintenanceRepository.findById(requestId);

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
      await this.maintenanceRepository.delete(requestId);

      // Record deletion activity
      await this.activitiesRepository.recordActivity({
        userId,
        action: "deleted_request",
        entityType: "maintenance_request",
        entityId: requestId,
        unitId: request.unitId,
      });
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

    return this.maintenanceRepository.getStats(propertyId);
  }

  /**
   * Get activities for the current user
   */
  async getActivities(
    userId: string,
    userRole: string
  ): Promise<Record<string, any[]>> {
    // Check permissions based on role
    // ...

    return this.activitiesRepository.findActivities();
  }

  /**
   * Clear an activity
   */
  async clearActivity(
    activityId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Check permissions
    // ...

    await this.activitiesRepository.deleteActivity(activityId);
  }

  /**
   * Clear all activities
   */
  async clearAllActivities(userId: string, userRole: string): Promise<void> {
    // Check permissions
    // ...

    await this.activitiesRepository.deleteAllActivities(userId);
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

    // This method would need to be implemented in repository
    // For now, we'll throw an error
    throw new Error("Not implemented");
  }

  /**
   * Get all maintenance categories
   */
  async getMaintenanceCategories(): Promise<any[]> {
    // This method would need to be implemented in repository
    // For now, we'll return an empty array
    return [];
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
    const stats = await this.maintenanceRepository.getStats(
      reportData.propertyId
    );

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
      open: ["in_progress", "completed", "closed", "cancelled", "processed"],
      in_progress: ["completed", "open", "closed", "cancelled"],
      completed: ["closed", "in_progress"], // Can reopen if needed
      closed: ["open"], // Can reopen but rare
      cancelled: ["open"], // Can reopen but rare
      processed: ["completed", "closed"], // Once processed into a work order
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

// Export a singleton instance with dependency injection
export const maintenanceService = new MaintenanceService(
  maintenanceRepository,
  activitiesRepository
);
