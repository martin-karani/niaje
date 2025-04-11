import { router } from "@/trpc/core";
import {
  landlordProcedure,
  propertyOwnerProcedure,
  protectedProcedure,
} from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import {
  assignPermissionDto,
  propertyIdDto,
  revokePermissionDto,
} from "./dto/permissions.dto";
import { permissionsService } from "./services/permissions.service";

export const permissionsRouter = router({
  // Get all permissions for the current user
  getUserPermissions: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Pass user details needed by the service method
      return await permissionsService.getUserPermissions(
        ctx.user.id,
        ctx.user.role,
        ctx.user.name
      );
    } catch (error) {
      console.error("Failed to get user permissions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not retrieve permissions.",
      });
    }
  }),

  // Get permissions for a specific property (Owner only)
  getPropertyPermissions: propertyOwnerProcedure // Middleware handles ownership check based on input.propertyId
    .input(propertyIdDto)
    .query(async ({ ctx, input }) => {
      try {
        // Service method assumes access is already granted by middleware
        return await permissionsService.getPropertyPermissions(
          input.propertyId
        );
      } catch (error) {
        console.error(
          `Failed to get permissions for property ${input.propertyId}:`,
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not retrieve property permissions.",
        });
      }
    }),

  // Assign permission to a user for a property (Owner only)
  assign: propertyOwnerProcedure // Middleware handles ownership check based on input.propertyId
    .input(assignPermissionDto)
    .mutation(async ({ ctx, input }) => {
      try {
        // Pass input DTO and the granter's ID (current user)
        return await permissionsService.assignPermission(input, ctx.user.id);
      } catch (error: any) {
        console.error("Failed to assign permission:", error);
        if (error instanceof TRPCError) throw error; // Re-throw known TRPC errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign permission.",
        });
      }
    }),

  // Revoke permission (Owner only)
  revoke: propertyOwnerProcedure // Middleware handles ownership check based on input.propertyId
    .input(revokePermissionDto)
    .mutation(async ({ ctx, input }) => {
      try {
        // Pass input DTO and the revoker's ID (current user)
        return await permissionsService.revokePermission(input, ctx.user.id);
      } catch (error: any) {
        console.error("Failed to revoke permission:", error);
        if (error instanceof TRPCError) throw error; // Re-throw known TRPC errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke permission.",
        });
      }
    }),

  // Get users who can be assigned to properties (Landlords only)
  getAssignableUsers: landlordProcedure.query(async ({ ctx }) => {
    try {
      return await permissionsService.getAssignableUsers();
    } catch (error) {
      console.error("Failed to get assignable users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not retrieve assignable users.",
      });
    }
  }),
});
