import { router } from "@/trpc/core";
import {
  propertiesManageProcedure,
  propertiesViewProcedure,
  propertyManageProcedure,
} from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import {
  createPropertyDto,
  propertyIdDto,
  updatePropertyDto,
} from "./dto/properties.dto";
import { propertiesService } from "./services/properties.service";

export const propertiesRouter = router({
  // Get all properties visible to current user
  getAll: propertiesViewProcedure.query(async ({ ctx }) => {
    try {
      return propertiesService.getPropertiesForUser(ctx.user.id, ctx.user.role);
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch properties",
      });
    }
  }),

  // Get property by ID
  getById: propertiesViewProcedure
    .input(propertyIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return propertiesService.getPropertyById(
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
        console.error("Error fetching property:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch property",
        });
      }
    }),

  // Create a new property
  create: propertiesManageProcedure
    .input(createPropertyDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return propertiesService.createProperty(input, ctx.user.id);
      } catch (error) {
        console.error("Error creating property:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create property",
        });
      }
    }),

  // Update an existing property
  update: propertyManageProcedure
    .input(updatePropertyDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return propertiesService.updateProperty(
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
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error updating property:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update property",
        });
      }
    }),

  // Delete a property
  delete: propertyManageProcedure
    .input(propertyIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await propertiesService.deleteProperty(
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
        console.error("Error deleting property:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete property",
        });
      }
    }),
});
