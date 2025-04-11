// src/permissions/trpc.ts
import { db } from "@/db";
import { userPermissions } from "@/db/schema";
import { createId } from "@/db/utils";
import { router } from "@/trpc/core";
import { adminProcedure, protectedProcedure } from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { Permission, ROLE_PERMISSIONS } from "./models";

export const permissionsRouter = router({
  // Get current user's permissions
  getUserPermissions: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.permissions.getUserPermissions();
    } catch (error) {
      console.error("Failed to get user permissions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not retrieve permissions.",
      });
    }
  }),

  // Get role-based permissions
  getRolePermissions: protectedProcedure
    .input(
      z.object({
        role: z.string(),
      })
    )
    .query(({ input }) => {
      return ROLE_PERMISSIONS[input.role] || [];
    }),

  // Get all roles and their permissions
  getAllRolePermissions: protectedProcedure.query(() => {
    return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
      role,
      permissions,
    }));
  }),

  // Grant property permission to a user
  grantPropertyPermission: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        propertyId: z.string(),
        permissions: z.object({
          canManageTenants: z.boolean().optional(),
          canManageLeases: z.boolean().optional(),
          canCollectPayments: z.boolean().optional(),
          canViewFinancials: z.boolean().optional(),
          canManageMaintenance: z.boolean().optional(),
          canManageProperties: z.boolean().optional(),
        }),
        role: z.string().default("custom"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if permission already exists
        const existingPerm = await db.query.userPermissions.findFirst({
          where: and(
            eq(userPermissions.userId, input.userId),
            eq(userPermissions.propertyId, input.propertyId)
          ),
        });

        if (existingPerm) {
          // Update existing permission
          const [updatedPerm] = await db
            .update(userPermissions)
            .set({
              ...input.permissions,
              role: input.role,
              updatedAt: new Date(),
            })
            .where(eq(userPermissions.id, existingPerm.id))
            .returning();

          return updatedPerm;
        } else {
          // Create new permission
          const [newPerm] = await db
            .insert(userPermissions)
            .values({
              id: createId(),
              userId: input.userId,
              propertyId: input.propertyId,
              role: input.role,
              ...input.permissions,
              grantedBy: ctx.user.id,
              updatedAt: new Date(),
            })
            .returning();

          return newPerm;
        }
      } catch (error) {
        console.error("Error granting permission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to grant permission",
        });
      }
    }),

  // Revoke property permission
  revokePropertyPermission: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        propertyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Delete the permission
        await db
          .delete(userPermissions)
          .where(
            and(
              eq(userPermissions.userId, input.userId),
              eq(userPermissions.propertyId, input.propertyId)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("Error revoking permission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke permission",
        });
      }
    }),

  // Check if user has specific permission (useful for UI)
  checkPermission: protectedProcedure
    .input(
      z.object({
        permission: z.string() as z.ZodType<Permission>,
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.permissions.hasPermission(input.permission);
      } catch (error) {
        console.error("Error checking permission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check permission",
        });
      }
    }),

  // Check if user has property-specific permission (useful for UI)
  checkPropertyPermission: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        permission: z.string() as z.ZodType<Permission>,
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.permissions.hasPropertyPermission(
          input.propertyId,
          input.permission
        );
      } catch (error) {
        console.error("Error checking property permission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check property permission",
        });
      }
    }),
});
