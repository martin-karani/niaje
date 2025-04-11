import { router } from "@/trpc/core";
import { tenantsManageProcedure } from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import {
  createTenantDto,
  tenantFilterDto,
  tenantIdDto,
  updateTenantDto,
} from "./dto/tenants.dto";
import { tenantsService } from "./services/tenants.service";

export const tenantsRouter = router({
  // Get all tenants with filtering
  getAll: tenantsManageProcedure
    .input(tenantFilterDto)
    .query(async ({ ctx, input }) => {
      try {
        return tenantsService.getTenants(input, ctx.user.id, ctx.user.role);
      } catch (error) {
        console.error("Error fetching tenants:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tenants",
        });
      }
    }),

  // Get tenant by ID
  getById: tenantsManageProcedure
    .input(tenantIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return tenantsService.getTenantById(
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tenant",
        });
      }
    }),

  // Create a new tenant
  create: tenantsManageProcedure
    .input(createTenantDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return tenantsService.createTenant(input, ctx.user.id, ctx.user.role);
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error creating tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create tenant",
        });
      }
    }),

  // Update an existing tenant
  update: tenantsManageProcedure
    .input(updateTenantDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return tenantsService.updateTenant(
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
        if (error.message.includes("already exists")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error updating tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tenant",
        });
      }
    }),

  // Delete a tenant
  delete: tenantsManageProcedure
    .input(tenantIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await tenantsService.deleteTenant(input.id, ctx.user.id, ctx.user.role);
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
        if (error.message.includes("active leases")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        console.error("Error deleting tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete tenant",
        });
      }
    }),

  // Get tenant statistics
  getStats: tenantsManageProcedure.query(async ({ ctx }) => {
    try {
      return tenantsService.getTenantStats(ctx.user.id, ctx.user.role);
    } catch (error: any) {
      if (error.name === "PermissionError") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error.message,
        });
      }
      console.error("Error fetching tenant stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tenant statistics",
      });
    }
  }),
});
