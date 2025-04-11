import { router } from "@/trpc";
import {
  landlordProcedure,
  propertyOwnerProcedure,
  propertyProcedure,
  protectedProcedure,
} from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import {
  createPropertyDto,
  propertyIdDto,
  updatePropertyDto,
} from "./dto/properties.dto";
import { propertiesService } from "./services/properties.service";

export const propertiesRouter = router({
  // Get all properties visible to the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    return propertiesService.getPropertiesForUser(user.id, user.role);
  }),

  // Get property by ID (if user has access)
  getById: propertyProcedure
    .input(propertyIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return propertiesService.getPropertyById(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch property",
        });
      }
    }),

  // Create a new property (landlords only)
  create: landlordProcedure
    .input(createPropertyDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return propertiesService.createProperty(input, ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create property",
        });
      }
    }),

  // Update an existing property (property owners only)
  update: propertyOwnerProcedure
    .input(updatePropertyDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return propertiesService.updateProperty(
          input.id,
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error) {
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update property",
        });
      }
    }),

  // Delete a property (property owners only)
  delete: propertyOwnerProcedure
    .input(propertyIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await propertiesService.deleteProperty(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
        return { success: true };
      } catch (error) {
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete property",
        });
      }
    }),
});
