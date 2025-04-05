import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { router, publicProcedure } from "../index";
import {
  protectedProcedure,
  adminProcedure,
  landlordProcedure,
} from "../middleware";
import { users } from "../../db/schema";

// Define input schemas for procedures
const userProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  image: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
});

const userIdSchema = z.object({
  id: z.string(),
});

// Create the users router
export const usersRouter = router({
  // Get own profile
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        image: true,
        address: true,
        city: true,
        country: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // You could add role-specific information here if needed
    return user;
  }),

  // Update own profile
  updateProfile: protectedProcedure
    .input(userProfileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .update(users)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id))
          .returning();

        if (!result.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return {
          success: true,
          user: result[0],
        };
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),

  // Get all users (admin only)
  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [sql`created_at desc`],
    });
  }),

  // Get user by ID (admin or related landlord)
  getById: protectedProcedure
    .input(userIdSchema)
    .query(async ({ ctx, input }) => {
      // Check if requesting self
      const isSelf = ctx.user.id === input.id;

      // Allow admin access
      const isAdmin = ctx.user.role === "ADMIN";

      // Allow landlord to access their linked agents/caretakers
      let canAccess = isSelf || isAdmin;

      if (!canAccess && ctx.user.role === "LANDLORD") {
        // Check if landlord has a property with this user as caretaker or agent
        const property = await ctx.db.query.properties.findFirst({
          where: sql`owner_id = ${ctx.user.id} AND (caretaker_id = ${input.id} OR agent_id = ${input.id})`,
        });

        canAccess = Boolean(property);
      }

      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this user profile",
        });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          image: true,
          address: true,
          city: true,
          country: true,
          bio: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Create a new user (admin only)
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        role: z.enum(["LANDLORD", "CARETAKER", "AGENT", "ADMIN"]).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use",
        });
      }

      // Create the basic User record
      const result = await ctx.db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          role: input.role || "LANDLORD",
          phone: input.phone,
          address: input.address,
          city: input.city,
          country: input.country,
          updatedAt: new Date(),
        })
        .returning();

      return result[0];
    }),

  // Check if landlord can access another user
  canLandlordAccessUser: landlordProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const property = await ctx.db.query.properties.findFirst({
        where: sql`owner_id = ${ctx.user.id} AND (caretaker_id = ${input.userId} OR agent_id = ${input.userId})`,
      });

      return Boolean(property);
    }),
});
