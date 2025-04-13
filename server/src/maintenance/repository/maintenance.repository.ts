import { db } from "@/db";
import {
  activities,
  maintenanceComments,
  maintenanceRequests,
  NewMaintenanceComment,
  workOrders,
} from "@/db/schema";
import { units } from "@/db/schema/properties";
import {
  MaintenanceRequestFilterDto,
  WorkOrderFilterDto,
} from "@/maintenance/dto/maintenance.dto";
import {
  MaintenanceComment,
  MaintenanceRequestWithRelations,
  MaintenanceStats,
  WorkOrderWithRelations,
} from "@/maintenance/types";
import {
  and,
  count,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  sum,
} from "drizzle-orm";
import {
  AssignMaintenanceRequestDto,
  CreateMaintenanceRequestDto,
  CreateWorkOrderDto,
  ResolveMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  UpdateWorkOrderDto,
} from "../dto/maintenance.dto";

export class MaintenanceRepository {
  /**
   * Find all maintenance requests with filtering and pagination
   */
  async findAll(
    filters?: MaintenanceRequestFilterDto
  ): Promise<MaintenanceRequestWithRelations[]> {
    // Build the base query
    let query = db.query.maintenanceRequests;

    // Build the conditions array for filtering
    const conditions = [];

    // Apply property ID filter (requires joining through units)
    if (filters?.propertyId) {
      conditions.push(
        eq(
          maintenanceRequests.unitId,
          db
            .select({ id: units.id })
            .from(units)
            .where(eq(units.propertyId, filters.propertyId))
            .limit(1)
        )
      );
    }

    // Apply unit ID filter
    if (filters?.unitId) {
      conditions.push(eq(maintenanceRequests.unitId, filters.unitId));
    }

    // Apply tenant ID filter
    if (filters?.tenantId) {
      conditions.push(eq(maintenanceRequests.tenantId, filters.tenantId));
    }

    // Apply status filter
    if (filters?.status) {
      conditions.push(eq(maintenanceRequests.status, filters.status));
    }

    // Apply priority filter
    if (filters?.priority) {
      conditions.push(eq(maintenanceRequests.priority, filters.priority));
    }

    // Apply assigned to filter
    if (filters?.assignedTo) {
      conditions.push(eq(maintenanceRequests.assignedTo, filters.assignedTo));
    }

    // Apply date range filters
    if (filters?.dateFrom) {
      conditions.push(gte(maintenanceRequests.reportedAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(maintenanceRequests.reportedAt, filters.dateTo));
    }

    // Apply search filter (search in title and description)
    if (filters?.search) {
      conditions.push(
        or(
          ilike(maintenanceRequests.title, `%${filters.search}%`),
          ilike(maintenanceRequests.description, `%${filters.search}%`)
        )
      );
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Execute the query with all conditions and pagination
    const result = await query.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          columns: {
            id: true,
            name: true,
          },
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        assignee: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        workOrder: true, // Include the related work order
      },
      orderBy: [sql`reported_at desc`],
      limit,
      offset,
    });

    // For each request, get the comments
    const requestsWithComments = await Promise.all(
      result.map(async (request) => {
        const comments = await this.getRequestComments(request.id);
        return {
          ...request,
          comments,
        };
      })
    );

    return requestsWithComments;
  }

  /**
   * Find all work orders with filtering and pagination
   */
  async findAllWorkOrders(
    filters?: WorkOrderFilterDto
  ): Promise<WorkOrderWithRelations[]> {
    // Build the conditions array for filtering
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(
        eq(
          workOrders.unitId,
          db
            .select({ id: units.id })
            .from(units)
            .where(eq(units.propertyId, filters.propertyId))
            .limit(1)
        )
      );
    }

    if (filters?.unitId) {
      conditions.push(eq(workOrders.unitId, filters.unitId));
    }

    if (filters?.tenantId) {
      conditions.push(eq(workOrders.tenantId, filters.tenantId));
    }

    if (filters?.status) {
      conditions.push(eq(workOrders.status, filters.status));
    }

    if (filters?.priority) {
      conditions.push(eq(workOrders.priority, filters.priority));
    }

    if (filters?.assignedTo) {
      conditions.push(eq(workOrders.assignedTo, filters.assignedTo));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(workOrders.reportedAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(workOrders.reportedAt, filters.dateTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(workOrders.title, `%${filters.search}%`),
          ilike(workOrders.description, `%${filters.search}%`)
        )
      );
    }

    if (filters?.category) {
      conditions.push(eq(workOrders.category, filters.category));
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Execute the query with all conditions and pagination
    return db.query.workOrders.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        maintenanceRequest: true,
        unit: {
          with: {
            property: true,
          },
        },
        tenant: true,
        assignee: true,
      },
      orderBy: [sql`reported_at desc`],
      limit,
      offset,
    });
  }

  /**
   * Count maintenance requests with filters (for pagination)
   */
  async countRequests(
    filters?: Omit<MaintenanceRequestFilterDto, "page" | "limit">
  ): Promise<number> {
    // Similar filtering logic as findAll, but just return the count
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(
        eq(
          maintenanceRequests.unitId,
          db
            .select({ id: units.id })
            .from(units)
            .where(eq(units.propertyId, filters.propertyId))
            .limit(1)
        )
      );
    }

    if (filters?.unitId) {
      conditions.push(eq(maintenanceRequests.unitId, filters.unitId));
    }

    if (filters?.tenantId) {
      conditions.push(eq(maintenanceRequests.tenantId, filters.tenantId));
    }

    if (filters?.status) {
      conditions.push(eq(maintenanceRequests.status, filters.status));
    }

    if (filters?.priority) {
      conditions.push(eq(maintenanceRequests.priority, filters.priority));
    }

    if (filters?.assignedTo) {
      conditions.push(eq(maintenanceRequests.assignedTo, filters.assignedTo));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(maintenanceRequests.reportedAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(maintenanceRequests.reportedAt, filters.dateTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(maintenanceRequests.title, `%${filters.search}%`),
          ilike(maintenanceRequests.description, `%${filters.search}%`)
        )
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(maintenanceRequests)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Count work orders with filters (for pagination)
   */
  async countWorkOrders(
    filters?: Omit<WorkOrderFilterDto, "page" | "limit">
  ): Promise<number> {
    const conditions = [];

    if (filters?.propertyId) {
      conditions.push(
        eq(
          workOrders.unitId,
          db
            .select({ id: units.id })
            .from(units)
            .where(eq(units.propertyId, filters.propertyId))
            .limit(1)
        )
      );
    }

    if (filters?.unitId) {
      conditions.push(eq(workOrders.unitId, filters.unitId));
    }

    if (filters?.tenantId) {
      conditions.push(eq(workOrders.tenantId, filters.tenantId));
    }

    if (filters?.status) {
      conditions.push(eq(workOrders.status, filters.status));
    }

    if (filters?.priority) {
      conditions.push(eq(workOrders.priority, filters.priority));
    }

    if (filters?.assignedTo) {
      conditions.push(eq(workOrders.assignedTo, filters.assignedTo));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(workOrders.reportedAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(workOrders.reportedAt, filters.dateTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(workOrders.title, `%${filters.search}%`),
          ilike(workOrders.description, `%${filters.search}%`)
        )
      );
    }

    if (filters?.category) {
      conditions.push(eq(workOrders.category, filters.category));
    }

    const [result] = await db
      .select({ count: count() })
      .from(workOrders)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a maintenance request by ID with related data
   */
  async findById(id: string): Promise<MaintenanceRequestWithRelations | null> {
    const request = await db.query.maintenanceRequests.findFirst({
      where: eq(maintenanceRequests.id, id),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          columns: {
            id: true,
            name: true,
          },
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        assignee: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        workOrder: true, // Include the related work order
      },
    });

    if (!request) return null;

    // Get comments for this request
    const comments = await this.getRequestComments(id);

    return {
      ...request,
      comments,
    };
  }

  /**
   * Find a work order by ID with related data
   */
  async findWorkOrderById(id: string): Promise<WorkOrderWithRelations | null> {
    return db.query.workOrders.findFirst({
      where: eq(workOrders.id, id),
      with: {
        maintenanceRequest: true,
        unit: {
          with: {
            property: true,
          },
        },
        tenant: true,
        assignee: true,
      },
    });
  }

  /**
   * Get comments for a maintenance request
   */
  async getRequestComments(requestId: string): Promise<MaintenanceComment[]> {
    return db.query.maintenanceComments.findMany({
      where: eq(maintenanceComments.requestId, requestId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [sql`created_at asc`],
    });
  }

  /**
   * Create a new maintenance request
   */
  async create(
    requestData: CreateMaintenanceRequestDto
  ): Promise<MaintenanceRequestWithRelations> {
    // Insert the new request
    const [request] = await db
      .insert(maintenanceRequests)
      .values({
        ...requestData,
        status: "open",
        reportedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return the newly created request with relations
    return this.findById(
      request.id
    ) as Promise<MaintenanceRequestWithRelations>;
  }

  /**
   * Update an existing maintenance request
   */
  async update(
    id: string,
    requestData: Partial<UpdateMaintenanceRequestDto>,
    userId: string
  ): Promise<MaintenanceRequestWithRelations> {
    // Get the current state of the request
    const existingRequest = await this.findById(id);

    if (!existingRequest) {
      throw new Error("Maintenance request not found");
    }

    // Remove id from the update data if present
    const { id: _, ...updateData } = requestData;

    // Begin a transaction
    return db.transaction(async (tx) => {
      // Update the request
      const [updatedRequest] = await tx
        .update(maintenanceRequests)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequests.id, id))
        .returning();

      // If status changed, record an activity
      if (requestData.status && requestData.status !== existingRequest.status) {
        await tx.insert(activities).values({
          userId,
          action: "changed_status",
          entityType: "maintenance_request",
          entityId: id,
          unitId: existingRequest.unitId,
          previousStatus: existingRequest.status,
          newStatus: requestData.status,
        });
      }

      return this.findById(id) as Promise<MaintenanceRequestWithRelations>;
    });
  }

  /**
   * Create a work order from a maintenance request
   */
  async createWorkOrderFromRequest(
    requestId: string,
    userId: string,
    workOrderData: Partial<CreateWorkOrderDto> = {}
  ): Promise<WorkOrderWithRelations> {
    // First get the request
    const request = await this.findById(requestId);

    if (!request) {
      throw new Error("Maintenance request not found");
    }

    // Begin a transaction
    return db.transaction(async (tx) => {
      // Create work order
      const [workOrder] = await tx
        .insert(workOrders)
        .values({
          requestId: request.id,
          title: workOrderData.title || request.title,
          description: workOrderData.description || request.description,
          priority:
            workOrderData.priority || this.mapPriority(request.priority),
          status: "pending", // Default to pending
          unitId: request.unitId,
          tenantId: request.tenantId,
          assignedTo: workOrderData.assignedTo,
          assignedToName: workOrderData.assignedToName,
          assignedToPhone: workOrderData.assignedToPhone,
          assignedToEmail: workOrderData.assignedToEmail,
          reportedAt: request.reportedAt,
          category: workOrderData.category,
          images: request.images,
          notes: workOrderData.notes || request.notes,
        })
        .returning();

      // Update the request with the work order ID
      await tx
        .update(maintenanceRequests)
        .set({
          workOrderId: workOrder.id,
          status: "processed", // Mark request as processed
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequests.id, requestId));

      // Create activity record for the request status change
      await tx.insert(activities).values({
        userId,
        action: "changed_status",
        entityType: "maintenance_request",
        entityId: request.id,
        unitId: request.unitId,
        previousStatus: request.status,
        newStatus: "processed",
      });

      // Create activity record for the work order creation
      await tx.insert(activities).values({
        userId,
        action: "created_work_order",
        entityType: "work_order",
        entityId: workOrder.id,
        unitId: workOrder.unitId,
      });

      // Return the complete work order with relations
      return this.findWorkOrderById(
        workOrder.id
      ) as Promise<WorkOrderWithRelations>;
    });
  }

  /**
   * Map request priority to work order priority
   */
  private mapPriority(requestPriority: string): string {
    switch (requestPriority) {
      case "low":
        return "normal";
      case "medium":
        return "normal";
      case "high":
        return "high";
      case "emergency":
        return "urgent";
      default:
        return "normal";
    }
  }

  /**
   * Update a work order
   */
  async updateWorkOrder(
    id: string,
    workOrderData: Partial<UpdateWorkOrderDto>,
    userId: string
  ): Promise<WorkOrderWithRelations> {
    const existingWorkOrder = await this.findWorkOrderById(id);

    if (!existingWorkOrder) {
      throw new Error("Work order not found");
    }

    // Begin a transaction
    return db.transaction(async (tx) => {
      // Update the work order
      const [updatedWorkOrder] = await tx
        .update(workOrders)
        .set({
          ...workOrderData,
          updatedAt: new Date(),
        })
        .where(eq(workOrders.id, id))
        .returning();

      // If status changed, record an activity
      if (
        workOrderData.status &&
        workOrderData.status !== existingWorkOrder.status
      ) {
        await tx.insert(activities).values({
          userId,
          action: "changed_status",
          entityType: "work_order",
          entityId: id,
          unitId: existingWorkOrder.unitId,
          previousStatus: existingWorkOrder.status,
          newStatus: workOrderData.status,
        });
      }

      return this.findWorkOrderById(id) as Promise<WorkOrderWithRelations>;
    });
  }

  /**
   * Assign a maintenance request to a user
   */
  async assign(
    data: AssignMaintenanceRequestDto,
    currentUserId: string
  ): Promise<MaintenanceRequestWithRelations> {
    // Get the current state of the request
    const existingRequest = await this.findById(data.id);

    if (!existingRequest) {
      throw new Error("Maintenance request not found");
    }

    // Begin a transaction
    return db.transaction(async (tx) => {
      // Update the request
      const [updatedRequest] = await tx
        .update(maintenanceRequests)
        .set({
          assignedTo: data.assignedTo,
          status: "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequests.id, data.id))
        .returning();

      // Record status change activity
      await tx.insert(activities).values({
        userId: currentUserId,
        action: "changed_status",
        entityType: "maintenance_request",
        entityId: data.id,
        unitId: existingRequest.unitId,
        previousStatus: existingRequest.status,
        newStatus: "in_progress",
      });

      // Record assignment activity
      await tx.insert(activities).values({
        userId: currentUserId,
        action: "assigned_request",
        entityType: "maintenance_request",
        entityId: data.id,
        unitId: existingRequest.unitId,
        metadata: { assignedTo: data.assignedTo },
      });

      // Add a comment if notes are provided
      if (data.notes) {
        await this.addComment({
          requestId: data.id,
          userId: currentUserId,
          content: `Assigned to ${data.assignedTo}. ${data.notes}`,
          isPrivate: false,
        });
      }

      // Return the updated request with relations
      return this.findById(data.id) as Promise<MaintenanceRequestWithRelations>;
    });
  }

  /**
   * Mark a maintenance request as resolved
   */
  async resolve(
    data: ResolveMaintenanceRequestDto,
    currentUserId: string
  ): Promise<MaintenanceRequestWithRelations> {
    // Get the current state of the request
    const existingRequest = await this.findById(data.id);

    if (!existingRequest) {
      throw new Error("Maintenance request not found");
    }

    // Begin a transaction
    return db.transaction(async (tx) => {
      // Update the request
      const [updatedRequest] = await tx
        .update(maintenanceRequests)
        .set({
          status: "completed",
          resolvedAt: new Date(),
          cost: data.cost,
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequests.id, data.id))
        .returning();

      // Record status change activity
      await tx.insert(activities).values({
        userId: currentUserId,
        action: "changed_status",
        entityType: "maintenance_request",
        entityId: data.id,
        unitId: existingRequest.unitId,
        previousStatus: existingRequest.status,
        newStatus: "completed",
      });

      // Add a resolution comment
      await this.addComment({
        requestId: data.id,
        userId: currentUserId,
        content: `Resolution: ${data.resolution}${
          data.notes ? `\n\nNotes: ${data.notes}` : ""
        }${data.cost ? `\n\nCost: $${data.cost}` : ""}`,
        isPrivate: false,
      });

      // If this request has a work order, update that too
      if (existingRequest.workOrderId) {
        await tx
          .update(workOrders)
          .set({
            status: "completed",
            resolvedAt: new Date(),
            cost: data.cost,
            updatedAt: new Date(),
          })
          .where(eq(workOrders.id, existingRequest.workOrderId));

        // Record activity for work order
        await tx.insert(activities).values({
          userId: currentUserId,
          action: "changed_status",
          entityType: "work_order",
          entityId: existingRequest.workOrderId,
          unitId: existingRequest.unitId,
          previousStatus: "pending", // Assuming it was pending
          newStatus: "completed",
        });
      }

      // Return the updated request with relations
      return this.findById(data.id) as Promise<MaintenanceRequestWithRelations>;
    });
  }

  /**
   * Add a comment to a maintenance request
   */
  async addComment(
    commentData: NewMaintenanceComment
  ): Promise<MaintenanceComment> {
    const [comment] = await db
      .insert(maintenanceComments)
      .values({
        ...commentData,
        updatedAt: new Date(),
      })
      .returning();

    return comment;
  }

  /**
   * Delete a maintenance request (use with caution)
   */
  async delete(id: string): Promise<void> {
    // Check if request has a work order
    const request = await this.findById(id);
    if (request?.workOrderId) {
      // First delete the work order
      await db.delete(workOrders).where(eq(workOrders.id, request.workOrderId));
    }

    // Delete the request (this will cascade to comments due to FK constraint)
    await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id));
  }

  /**
   * Get maintenance request statistics
   */
  async getStats(propertyId?: string): Promise<MaintenanceStats> {
    // Existing implementation...
    let queryConditions = [];

    // If property ID is provided, limit stats to that property
    if (propertyId) {
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, propertyId),
        columns: { id: true },
      });
      const unitIds = propertyUnits.map((unit) => unit.id);
      if (unitIds.length > 0) {
        // Use inArray instead of eq for checking membership
        queryConditions.push(inArray(maintenanceRequests.unitId, unitIds));
      } else {
        // No units found for this property, return empty stats
        return {
          totalRequests: 0,
          openRequests: 0,
          inProgressRequests: 0,
          completedRequests: 0,
          requestsByPriority: [],
          requestsByStatus: [],
          avgResolutionTime: 0,
          totalMaintenanceCost: 0,
        };
      }
    }

    // Get total requests
    const [totalResult] = await db
      .select({ count: count() })
      .from(maintenanceRequests)
      .where(queryConditions.length ? and(...queryConditions) : undefined);

    // Get open requests
    const openConditions = [
      ...queryConditions,
      eq(maintenanceRequests.status, "open"),
    ];
    const [openResult] = await db
      .select({ count: count() })
      .from(maintenanceRequests)
      .where(openConditions.length ? and(...openConditions) : undefined);

    // Get in-progress requests
    const inProgressConditions = [
      ...queryConditions,
      eq(maintenanceRequests.status, "in_progress"),
    ];
    const [inProgressResult] = await db
      .select({ count: count() })
      .from(maintenanceRequests)
      .where(
        inProgressConditions.length ? and(...inProgressConditions) : undefined
      );

    // Get completed requests
    const completedConditions = [
      ...queryConditions,
      eq(maintenanceRequests.status, "completed"),
    ];
    const [completedResult] = await db
      .select({ count: count() })
      .from(maintenanceRequests)
      .where(
        completedConditions.length ? and(...completedConditions) : undefined
      );

    // Get requests by priority
    const priorityCountsResult = await db
      .select({
        priority: maintenanceRequests.priority,
        count: count(),
      })
      .from(maintenanceRequests)
      .where(queryConditions.length ? and(...queryConditions) : undefined)
      .groupBy(maintenanceRequests.priority);

    // Get requests by status
    const statusCountsResult = await db
      .select({
        status: maintenanceRequests.status,
        count: count(),
      })
      .from(maintenanceRequests)
      .where(queryConditions.length ? and(...queryConditions) : undefined)
      .groupBy(maintenanceRequests.status);

    // Calculate average resolution time for completed requests
    // This is more complex as we need to calculate the difference between reported_at and resolved_at
    // This SQL is PostgreSQL specific
    const avgResolutionResult = await db.execute<{ avg_days: number }>(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at)) / 86400) as avg_days
      FROM maintenance_requests
      WHERE status = 'completed'
      ${queryConditions.length ? sql`AND ${and(...queryConditions)}` : sql``}
      AND resolved_at IS NOT NULL
    `);
    const avgDays = avgResolutionResult.rows[0]?.avg_days || 0;

    // Get total maintenance cost
    const [totalCostResult] = await db
      .select({
        totalCost: sum(maintenanceRequests.cost),
      })
      .from(maintenanceRequests)
      .where(
        queryConditions.length
          ? and(...queryConditions, sql`cost IS NOT NULL`)
          : sql`cost IS NOT NULL`
      );
    return {
      totalRequests: totalResult.count,
      openRequests: openResult.count,
      inProgressRequests: inProgressResult.count,
      completedRequests: completedResult.count,
      requestsByPriority: priorityCountsResult.map((r) => ({
        priority: r.priority,
        count: Number(r.count),
      })),
      requestsByStatus: statusCountsResult.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      avgResolutionTime: avgDays,
      totalMaintenanceCost: Number(totalCostResult.totalCost) || 0,
    };
  }
}

// Export a singleton instance
export const maintenanceRepository = new MaintenanceRepository();
