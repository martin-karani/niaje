import { router } from "@/trpc/core";
import { adminProcedure, protectedProcedure } from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminChangePasswordDto,
  adminCreateUserDto,
  changePasswordDto,
  updateProfileDto,
  updateUserDto,
  userFilterDto,
  userIdDto,
} from "./dto/users.dto";
import { UsersService } from "./services/users.service";

export const usersRouter = router({
  // Get all users with filtering and pagination (admin only)
  getAll: adminProcedure.input(userFilterDto).query(async ({ ctx, input }) => {
    // Create service instance with auth
    const usersService = new UsersService(ctx.auth);

    try {
      return usersService.getUsers(input, ctx.user.role);
    } catch (error: any) {
      if (error.name === "PermissionError") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error.message,
        });
      }
      console.error("Error fetching users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users",
      });
    }
  }),

  // Get user by ID (self or admin)
  getById: protectedProcedure.input(userIdDto).query(async ({ ctx, input }) => {
    // Create service instance with auth
    const usersService = new UsersService(ctx.auth);

    try {
      return usersService.getUserById(input.id, ctx.user.id, ctx.user.role);
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
      console.error("Error fetching user:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user",
      });
    }
  }),

  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    // Create service instance with auth
    const usersService = new UsersService(ctx.auth);

    try {
      return usersService.getUserById(ctx.user.id, ctx.user.id, ctx.user.role);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch your profile",
      });
    }
  }),

  // Create a new user (admin only)
  create: adminProcedure
    .input(adminCreateUserDto)
    .mutation(async ({ ctx, input }) => {
      // Create service instance with auth
      const usersService = new UsersService(ctx.auth);

      try {
        return usersService.createUser(input, ctx.user.role);
      } catch (error: any) {
        if (error.name === "ConflictError") {
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
        console.error("Error creating user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }
    }),

  // Update a user (admin for any user, or self-update)
  update: protectedProcedure
    .input(updateUserDto)
    .mutation(async ({ ctx, input }) => {
      // Create service instance with auth
      const usersService = new UsersService(ctx.auth);

      try {
        return usersService.updateUser(
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
        console.error("Error updating user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
        });
      }
    }),

  // Update own profile (limited fields)
  updateProfile: protectedProcedure
    .input(updateProfileDto)
    .mutation(async ({ ctx, input }) => {
      // Create service instance with auth
      const usersService = new UsersService(ctx.auth);

      try {
        return usersService.updateProfile(ctx.user.id, input, ctx.user.id);
      } catch (error: any) {
        console.error("Error updating profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),

  // Change own password
  changePassword: protectedProcedure
    .input(changePasswordDto)
    .mutation(async ({ ctx, input }) => {
      // Create service instance with auth
      const usersService = new UsersService(ctx.auth);

      try {
        return usersService.changePassword(ctx.user.id, input, ctx.user.id);
      } catch (error: any) {
        if (error.message.includes("incorrect")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        console.error("Error changing password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change password",
        });
      }
    }),

  // Admin change user password
  adminChangePassword: adminProcedure
    .input(adminChangePasswordDto)
    .mutation(async ({ ctx, input }) => {
      // Create service instance with auth
      const usersService = new UsersService(ctx.auth);

      try {
        return usersService.adminChangePassword(input, ctx.user.role);
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error changing password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change password",
        });
      }
    }),

  // Set user active status (admin only)
  setActiveStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create service instance with auth
      const usersService = new UsersService(ctx.auth);

      try {
        return usersService.setActiveStatus(
          input.id,
          input.isActive,
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
        console.error("Error updating user status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user status",
        });
      }
    }),

  // Delete a user (admin only)
  delete: adminProcedure.input(userIdDto).mutation(async ({ ctx, input }) => {
    // Create service instance with auth
    const usersService = new UsersService(ctx.auth);

    try {
      return usersService.deleteUser(input.id, ctx.user.id, ctx.user.role);
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
      console.error("Error deleting user:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete user",
      });
    }
  }),

  // Get user statistics (admin only)
  getStats: adminProcedure.query(async ({ ctx }) => {
    // Create service instance with auth
    const usersService = new UsersService(ctx.auth);

    try {
      return usersService.getUserStats(ctx.user.role);
    } catch (error: any) {
      if (error.name === "PermissionError") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error.message,
        });
      }
      console.error("Error fetching user stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user statistics",
      });
    }
  }),

  // Get role permissions
  getRolePermissions: protectedProcedure
    .input(
      z.object({
        role: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Create service instance with auth
      const usersService = new UsersService(ctx.auth);

      if (input.role) {
        return usersService.getRolePermissions(input.role);
      } else {
        return usersService.getRolePermissions(ctx.user.role);
      }
    }),

  // Get all role permissions (useful for admin UI)
  getAllRolePermissions: adminProcedure.query(async ({ ctx }) => {
    // Create service instance with auth
    const usersService = new UsersService(ctx.auth);
    return usersService.getAllRolePermissions();
  }),
});
