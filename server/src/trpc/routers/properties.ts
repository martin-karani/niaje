import { properties } from "@/db/schema";
import {
  insertPropertySchema,
  propertyIdSchema,
  updatePropertySchema,
} from "@/db/schema/zod";
import { TRPCError } from "@trpc/server";
import { and, eq, or, sql } from "drizzle-orm";
import { router } from "../index";
import { landlordProcedure, protectedProcedure } from "../middleware";

// Create the properties router
export const propertiesRouter = router({
  // Get all properties visible to the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    // Query different properties based on user role
    if (user.role === "ADMIN") {
      // Admin can see all properties
      return ctx.db.query.properties.findMany({
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          caretaker: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          agent: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [sql`created_at desc`],
      });
    } else if (user.role === "LANDLORD") {
      // Landlords see properties they own
      return ctx.db.query.properties.findMany({
        where: eq(properties.ownerId, user.id),
        with: {
          caretaker: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          agent: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [sql`created_at desc`],
      });
    } else if (user.role === "CARETAKER") {
      // Caretakers see properties they manage
      return ctx.db.query.properties.findMany({
        where: eq(properties.caretakerId, user.id),
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          agent: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [sql`created_at desc`],
      });
    } else if (user.role === "AGENT") {
      // Agents see properties they represent
      return ctx.db.query.properties.findMany({
        where: eq(properties.agentId, user.id),
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          caretaker: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [sql`created_at desc`],
      });
    }

    // Default case (shouldn't happen due to role checks)
    return [];
  }),

  // Get property by ID (if user has access)
  getById: protectedProcedure
    .input(propertyIdSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      // Build the where condition based on user role
      let whereCondition;

      if (user.role === "ADMIN") {
        // Admin can see any property
        whereCondition = eq(properties.id, input.id);
      } else if (user.role === "LANDLORD") {
        // Landlords can see properties they own
        whereCondition = and(
          eq(properties.id, input.id),
          eq(properties.ownerId, user.id)
        );
      } else {
        // Caretakers and agents can see properties they're assigned to
        whereCondition = and(
          eq(properties.id, input.id),
          or(
            user.role === "CARETAKER"
              ? eq(properties.caretakerId, user.id)
              : sql`false`,
            user.role === "AGENT" ? eq(properties.agentId, user.id) : sql`false`
          )
        );
      }

      const property = await ctx.db.query.properties.findFirst({
        where: whereCondition,
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          caretaker: {
            columns: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          agent: {
            columns: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!property) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Property not found or you do not have permission to view it",
        });
      }

      return property;
    }),

  // Create a new property (landlords only)
  create: landlordProcedure
    .input(insertPropertySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .insert(properties)
          .values({
            name: input.name,
            address: input.address,
            type: input.type,
            description: input.description || null,
            ownerId: ctx.user.id, // Set the current user as owner
            caretakerId: input.caretakerId || null,
            agentId: input.agentId || null,
            updatedAt: new Date(),
          })
          .returning();

        return result[0];
      } catch (error) {
        console.error("Error creating property:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create property",
        });
      }
    }),

  // Update an existing property (landlords only)
  update: landlordProcedure
    .input(updatePropertySchema)
    .mutation(async ({ ctx, input }) => {
      // First check if the property exists and belongs to this landlord
      const existingProperty = await ctx.db.query.properties.findFirst({
        where: and(
          eq(properties.id, input.id),
          eq(properties.ownerId, ctx.user.id)
        ),
      });

      if (!existingProperty) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Property not found or you do not have permission to update it",
        });
      }

      // Remove id from the update data
      const { id, ...updateData } = input;

      try {
        const result = await ctx.db
          .update(properties)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(properties.id, id))
          .returning();

        return result[0];
      } catch (error) {
        console.error("Error updating property:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update property",
        });
      }
    }),

  // Delete a property (landlords only)
  delete: landlordProcedure
    .input(propertyIdSchema)
    .mutation(async ({ ctx, input }) => {
      // First check if the property exists and belongs to this landlord
      const existingProperty = await ctx.db.query.properties.findFirst({
        where: and(
          eq(properties.id, input.id),
          eq(properties.ownerId, ctx.user.id)
        ),
      });

      if (!existingProperty) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Property not found or you do not have permission to delete it",
        });
      }

      try {
        await ctx.db.delete(properties).where(eq(properties.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("Error deleting property:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete property",
        });
      }
    }),
});
