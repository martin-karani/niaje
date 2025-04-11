import { router } from "@/trpc/core";
import { landlordProcedure, leaseManagerProcedure } from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createLeaseDto,
  leaseFilterDto,
  leaseIdDto,
  renewLeaseDto,
  terminateLeaseDto,
  updateLeaseDto,
} from "./dto/leases.dto";
import { leasesService } from "./services/leases.service";

export const leasesRouter = router({
  // Get all leases with filtering and pagination
  getAll: leaseManagerProcedure
    .input(leaseFilterDto)
    .query(async ({ ctx, input }) => {
      try {
        const { leases, total, pages } = await leasesService.getLeases(
          input,
          ctx.user.id,
          ctx.user.role
        );
        return { leases, total, pages };
      } catch (error: any) {
        console.error("Error fetching leases:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch leases",
        });
      }
    }),

  // Get lease by ID
  getById: leaseManagerProcedure
    .input(
      leaseIdDto.extend({
        withTransactions: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return leasesService.getLeaseById(
          input.id,
          input.withTransactions,
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
        console.error("Error fetching lease:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lease",
        });
      }
    }),

  // Create a new lease
  create: leaseManagerProcedure
    .input(createLeaseDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return leasesService.createLease(input, ctx.user.id, ctx.user.role);
      } catch (error: any) {
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
        console.error("Error creating lease:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create lease",
        });
      }
    }),

  // Update an existing lease
  update: leaseManagerProcedure
    .input(updateLeaseDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return leasesService.updateLease(
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
        console.error("Error updating lease:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update lease",
        });
      }
    }),

  // Terminate a lease
  terminate: landlordProcedure
    .input(terminateLeaseDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return leasesService.terminateLease(input, ctx.user.id, ctx.user.role);
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
        console.error("Error terminating lease:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to terminate lease",
        });
      }
    }),

  // Renew a lease
  renew: leaseManagerProcedure
    .input(renewLeaseDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return leasesService.renewLease(input, ctx.user.id, ctx.user.role);
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
        console.error("Error renewing lease:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to renew lease",
        });
      }
    }),

  // Delete a lease (admin only)
  delete: landlordProcedure
    .input(leaseIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await leasesService.deleteLease(input.id, ctx.user.id, ctx.user.role);
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
        console.error("Error deleting lease:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete lease",
        });
      }
    }),

  // Get lease statistics
  getStats: leaseManagerProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return leasesService.getLeaseStats(
          input.propertyId,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        console.error("Error fetching lease stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lease statistics",
        });
      }
    }),

  // Get leases expiring soon
  getExpiringLeases: leaseManagerProcedure
    .input(
      z.object({
        daysAhead: z.number().positive().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return leasesService.getExpiringLeases(
          input.daysAhead,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        console.error("Error fetching expiring leases:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch expiring leases",
        });
      }
    }),

  // Get leases by tenant ID
  getByTenant: leaseManagerProcedure
    .input(
      z.object({
        tenantId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return leasesService.getLeasesByTenant(
          input.tenantId,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        console.error("Error fetching tenant leases:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch leases for tenant",
        });
      }
    }),

  // Get leases by unit ID
  getByUnit: leaseManagerProcedure
    .input(
      z.object({
        unitId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return leasesService.getLeasesByUnit(
          input.unitId,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        console.error("Error fetching unit leases:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch leases for unit",
        });
      }
    }),

  // Get active lease for a unit
  getActiveLeaseForUnit: leaseManagerProcedure
    .input(
      z.object({
        unitId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return leasesService.getActiveLeaseForUnit(
          input.unitId,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        console.error("Error fetching active unit lease:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch active lease for unit",
        });
      }
    }),
});
