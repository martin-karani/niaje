import { router } from "@/trpc/core";
import {
  adminProcedure,
  maintenanceManageProcedure,
  protectedProcedure,
} from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  assignMaintenanceRequestDto,
  createMaintenanceCategoryDto,
  createMaintenanceCommentDto,
  createMaintenanceRequestDto,
  generateMaintenanceReportDto,
  maintenanceRequestFilterDto,
  maintenanceRequestIdDto,
  resolveMaintenanceRequestDto,
  updateMaintenanceRequestDto,
} from "./dto/maintenance.dto";
import { maintenanceService } from "./services/maintenance.service";

export const maintenanceRouter = router({
  // Get all maintenance requests with filtering and pagination
  getAll: maintenanceManageProcedure
    .input(maintenanceRequestFilterDto)
    .query(async ({ ctx, input }) => {
      try {
        const { requests, total, pages } =
          await maintenanceService.getMaintenanceRequests(
            input,
            ctx.user.id,
            ctx.user.role
          );
        return { requests, total, pages };
      } catch (error: any) {
        console.error("Error fetching maintenance requests:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch maintenance requests",
        });
      }
    }),

  // Get maintenance request by ID
  getById: maintenanceManageProcedure
    .input(maintenanceRequestIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return maintenanceService.getMaintenanceRequestById(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        console.error("Error fetching maintenance request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch maintenance request",
        });
      }
    }),

  // Create a new maintenance request
  create: maintenanceManageProcedure
    .input(createMaintenanceRequestDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return maintenanceService.createMaintenanceRequest(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error creating maintenance request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create maintenance request",
        });
      }
    }),

  // Update an existing maintenance request
  update: maintenanceManageProcedure
    .input(updateMaintenanceRequestDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return maintenanceService.updateMaintenanceRequest(
          input.id,
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error updating maintenance request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update maintenance request",
        });
      }
    }),

  // Assign a maintenance request
  assign: maintenanceManageProcedure
    .input(assignMaintenanceRequestDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return maintenanceService.assignMaintenanceRequest(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error assigning maintenance request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign maintenance request",
        });
      }
    }),

  // Resolve a maintenance request
  resolve: maintenanceManageProcedure
    .input(resolveMaintenanceRequestDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return maintenanceService.resolveMaintenanceRequest(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error resolving maintenance request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resolve maintenance request",
        });
      }
    }),

  // Add a comment to a maintenance request
  addComment: maintenanceManageProcedure
    .input(createMaintenanceCommentDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return maintenanceService.addComment(input, ctx.user.id, ctx.user.role);
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        console.error("Error adding comment to maintenance request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add comment to maintenance request",
        });
      }
    }),

  // Delete a maintenance request
  delete: adminProcedure
    .input(maintenanceRequestIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await maintenanceService.deleteMaintenanceRequest(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
        return { success: true };
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error deleting maintenance request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete maintenance request",
        });
      }
    }),

  // Get maintenance statistics
  getStats: maintenanceManageProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return maintenanceService.getMaintenanceStats(
          input.propertyId,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        console.error("Error fetching maintenance stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch maintenance statistics",
        });
      }
    }),

  // Create a new maintenance category
  createCategory: maintenanceManageProcedure
    .input(createMaintenanceCategoryDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return maintenanceService.createMaintenanceCategory(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error creating maintenance category:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create maintenance category",
        });
      }
    }),

  // Get all maintenance categories
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    try {
      return maintenanceService.getMaintenanceCategories();
    } catch (error: any) {
      console.error("Error fetching maintenance categories:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch maintenance categories",
      });
    }
  }),

  // Generate a maintenance report
  generateReport: maintenanceManageProcedure
    .input(generateMaintenanceReportDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return maintenanceService.generateMaintenanceReport(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error generating maintenance report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate maintenance report",
        });
      }
    }),
});
