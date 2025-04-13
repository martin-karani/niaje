import { router } from "@/trpc/core";
import { protectedProcedure } from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  markNotificationsReadDto,
  notificationFilterDto,
  notificationIdDto,
} from "./dto/notifications.dto";
import { notificationsService } from "./services/notifications.service";

export const notificationsRouter = router({
  // Get all notifications with filtering and pagination
  getAll: protectedProcedure
    .input(notificationFilterDto)
    .query(async ({ ctx, input }) => {
      try {
        const { notifications, total, pages } =
          await notificationsService.getNotifications(
            input,
            ctx.user.id,
            ctx.user.role
          );
        return { notifications, total, pages };
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching notifications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notifications",
        });
      }
    }),

  // Get notification by ID
  getById: protectedProcedure
    .input(notificationIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return notificationsService.getNotificationById(
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
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notification",
        });
      }
    }),

  // Mark a notification as read
  markAsRead: protectedProcedure
    .input(notificationIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return notificationsService.markAsRead(
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
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error marking notification as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notification as read",
        });
      }
    }),

  // Mark multiple notifications as read
  markMultipleAsRead: protectedProcedure
    .input(markNotificationsReadDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return notificationsService.markMultipleAsRead(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error marking notifications as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notifications as read",
        });
      }
    }),

  // Mark all notifications as read for current user
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return notificationsService.markAllAsRead(
        ctx.user.id,
        ctx.user.id,
        ctx.user.role
      );
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark all notifications as read",
      });
    }
  }),

  // Delete a notification
  delete: protectedProcedure
    .input(notificationIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await notificationsService.deleteNotification(
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
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error deleting notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete notification",
        });
      }
    }),

  // Delete all notifications for current user
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return notificationsService.deleteAllNotifications(
        ctx.user.id,
        ctx.user.id,
        ctx.user.role
      );
    } catch (error: any) {
      console.error("Error deleting all notifications:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete all notifications",
      });
    }
  }),

  // Get notification summary for current user
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      return notificationsService.getNotificationSummary(
        ctx.user.id,
        ctx.user.id,
        ctx.user.role
      );
    } catch (error: any) {
      console.error("Error fetching notification summary:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch notification summary",
      });
    }
  }),

  // Get notification summary for any user (admin only)
  getUserSummary: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return notificationsService.getNotificationSummary(
          input.userId,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching user notification summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user notification summary",
        });
      }
    }),
});
