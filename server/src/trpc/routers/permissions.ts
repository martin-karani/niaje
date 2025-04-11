import { properties, userPermissions, users } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { router } from "../index";
import {
  propertyOwnerProcedure,
  protectedProcedure,
} from "../middleware/permission.middleware";

// Helper function to get default permissions based on role
const getDefaultPermissionsForRole = (role: string) => {
  switch (role) {
    case "caretaker":
      return {
        canManageTenants: true,
        canManageLeases: false,
        canCollectPayments: true,
        canViewFinancials: false,
        canManageMaintenance: true,
        canManageProperties: false,
      };
    case "agent":
      return {
        canManageTenants: true,
        canManageLeases: true,
        canCollectPayments: false,
        canViewFinancials: false,
        canManageMaintenance: false,
        canManageProperties: false,
      };
    case "readonly":
      return {
        canManageTenants: false,
        canManageLeases: false,
        canCollectPayments: false,
        canViewFinancials: false,
        canManageMaintenance: false,
        canManageProperties: false,
      };
    default:
      return {
        canManageTenants: false,
        canManageLeases: false,
        canCollectPayments: false,
        canViewFinancials: false,
        canManageMaintenance: false,
        canManageProperties: false,
      };
  }
};

export const permissionsRouter = router({
  // Get all permissions for the current user
  getUserPermissions: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user) {
      return [];
    }

    // Get explicit permissions from userPermissions table
    const explicitPermissions = await ctx.db.query.userPermissions.findMany({
      where: eq(userPermissions.userId, user.id),
      with: {
        property: {
          columns: {
            name: true,
          },
        },
        grantedByUser: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Map to include property and grantor names
    const formattedPermissions = explicitPermissions.map((permission) => ({
      ...permission,
      propertyName: permission.property.name,
      grantedByName: permission.grantedByUser.name,
    }));

    // If user is a landlord, add "owner" permissions for their properties
    if (user.role === "LANDLORD") {
      const ownedProperties = await ctx.db.query.properties.findMany({
        where: eq(properties.ownerId, user.id),
      });

      // For each owned property, add an owner permission
      const ownerPermissions = ownedProperties.map((property) => ({
        id: `owner-${property.id}`,
        userId: user.id,
        propertyId: property.id,
        propertyName: property.name,
        role: "owner",
        canManageTenants: true,
        canManageLeases: true,
        canCollectPayments: true,
        canViewFinancials: true,
        canManageMaintenance: true,
        canManageProperties: true,
        grantedBy: user.id,
        grantedByName: user.name || "Self",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return [...formattedPermissions, ...ownerPermissions];
    }

    return formattedPermissions;
  }),

  // Get permissions for a specific property
  getPropertyPermissions: propertyOwnerProcedure
    .input(
      z.object({
        propertyId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const permissions = await ctx.db.query.userPermissions.findMany({
        where: eq(userPermissions.propertyId, input.propertyId),
        with: {
          user: {
            columns: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return permissions.map((permission) => ({
        ...permission,
        userName: permission.user.name,
        userEmail: permission.user.email,
        userRole: permission.user.role,
      }));
    }),

  // Assign permission to a user for a property
  assign: propertyOwnerProcedure
    .input(
      z.object({
        propertyId: z.string(),
        userId: z.string(),
        role: z.enum(["caretaker", "agent", "readonly", "custom"]),
        customPermissions: z
          .object({
            canManageTenants: z.boolean().optional(),
            canManageLeases: z.boolean().optional(),
            canCollectPayments: z.boolean().optional(),
            canViewFinancials: z.boolean().optional(),
            canManageMaintenance: z.boolean().optional(),
            canManageProperties: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user exists
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Get default permissions based on role
      const defaultPermissions = getDefaultPermissionsForRole(input.role);

      // Combine with custom permissions if provided
      const permissions = {
        ...defaultPermissions,
        ...(input.customPermissions || {}),
      };

      // Check if permission already exists
      const existingPermission = await ctx.db.query.userPermissions.findFirst({
        where: and(
          eq(userPermissions.userId, input.userId),
          eq(userPermissions.propertyId, input.propertyId)
        ),
      });

      if (existingPermission) {
        // Update existing permission
        const result = await ctx.db
          .update(userPermissions)
          .set({
            role: input.role,
            ...permissions,
            updatedAt: new Date(),
          })
          .where(eq(userPermissions.id, existingPermission.id))
          .returning();

        return result[0];
      } else {
        // Create new permission
        const result = await ctx.db
          .insert(userPermissions)
          .values({
            userId: input.userId,
            propertyId: input.propertyId,
            role: input.role,
            ...permissions,
            grantedBy: ctx.user.id,
          })
          .returning();

        return result[0];
      }
    }),

  // Revoke permission
  revoke: propertyOwnerProcedure
    .input(
      z.object({
        propertyId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, input.userId),
            eq(userPermissions.propertyId, input.propertyId)
          )
        );

      return { success: true };
    }),

  // Get users who can be assigned to properties (for UI dropdowns)
  getAssignableUsers: landlordProcedure.query(async ({ ctx }) => {
    // Get all users except admins (typically you wouldn't assign permissions to them)
    const assignableUsers = await ctx.db.query.users.findMany({
      where: inArray(users.role, ["CARETAKER", "AGENT"]),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: [users.name],
    });

    return assignableUsers;
  }),
});
