import { router } from "@/trpc/core";
import {
  propertiesViewProcedure,
  propertyManageProcedure,
} from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createUnitDto,
  unitFilterDto,
  unitIdDto,
  updateUnitDto,
} from "./dto/units.dto";
import { unitsService } from "./services/units.service";

export const unitsRouter = router({
  // Get all units with filtering and pagination
  getAll: propertiesViewProcedure
    .input(unitFilterDto)
    .query(async ({ ctx, input }) => {
      try {
        const { units, total, pages } = await unitsService.getUnits(
          input,
          ctx.user.id,
          ctx.user.role
        );
        return { units, total, pages };
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching units:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch units",
        });
      }
    }),

  // Get unit by ID
  getById: propertiesViewProcedure
    .input(unitIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return unitsService.getUnitById(input.id, ctx.user.id, ctx.user.role);
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
        console.error("Error fetching unit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch unit",
        });
      }
    }),

  // Create a new unit
  create: propertyManageProcedure
    .input(createUnitDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return unitsService.createUnit(input, ctx.user.id, ctx.user.role);
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
        console.error("Error creating unit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create unit",
        });
      }
    }),

  // Update a unit
  update: propertyManageProcedure
    .input(updateUnitDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return unitsService.updateUnit(
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
        console.error("Error updating unit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update unit",
        });
      }
    }),

  // Delete a unit
  delete: propertyManageProcedure
    .input(unitIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await unitsService.deleteUnit(input.id, ctx.user.id, ctx.user.role);
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
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error deleting unit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete unit",
        });
      }
    }),

  // Update unit status
  updateStatus: propertyManageProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "vacant",
          "occupied",
          "maintenance",
          "reserved",
          "unavailable",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return unitsService.updateUnitStatus(
          input.id,
          input.status,
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
        console.error("Error updating unit status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update unit status",
        });
      }
    }),

  // Get unit statistics
  getStats: propertiesViewProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return unitsService.getUnitStats(
          input.propertyId,
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
        console.error("Error fetching unit stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch unit statistics",
        });
      }
    }),

  // Get vacant units for a property
  getVacantUnits: propertiesViewProcedure
    .input(
      z.object({
        propertyId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return unitsService.getVacantUnits(
          input.propertyId,
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
        console.error("Error fetching vacant units:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch vacant units",
        });
      }
    }),
});
