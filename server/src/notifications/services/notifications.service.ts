import { createId } from "@/db/utils";
import { NotFoundError, PermissionError } from "@/errors";
import {
  CreateNotificationDto,
  MarkNotificationsReadDto,
  NotificationFilterDto,
} from "../dto/notifications.dto";
import { notificationsRepository } from "../repositories/notification.repository";
import {
  Notification,
  NotificationSummary,
  NotificationWithUser,
} from "../types";

export class NotificationsService {
  /**
   * Get notifications with optional filtering
   */
  async getNotifications(
    filters: NotificationFilterDto,
    userId: string,
    userRole: string
  ): Promise<{
    notifications: NotificationWithUser[];
    total: number;
    pages: number;
  }> {
    // Security check: users can only see their own notifications
    // unless they are admins
    if (filters.userId && filters.userId !== userId && userRole !== "ADMIN") {
      throw new PermissionError("You can only view your own notifications");
    }

    // If no userId filter is provided, use the current user's ID
    if (!filters.userId) {
      filters.userId = userId;
    }

    const notifications = await notificationsRepository.findAll(filters);
    const total = await notificationsRepository.countNotifications(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { notifications, total, pages };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(
    notificationId: string,
    userId: string,
    userRole: string
  ): Promise<Notification> {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    // Security check: users can only see their own notifications
    // unless they are admins
    if (notification.userId !== userId && userRole !== "ADMIN") {
      throw new PermissionError(
        "You do not have permission to view this notification"
      );
    }

    return notification;
  }

  /**
   * Create a new notification
   * Typically called by other services, not directly by API
   */
  async createNotification(
    notificationData: CreateNotificationDto
  ): Promise<Notification> {
    return notificationsRepository.create({
      ...notificationData,
      id: createId(), // This will be handled by the database, but adding for clarity
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
    userRole: string
  ): Promise<Notification> {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    // Security check: users can only mark their own notifications
    // unless they are admins
    if (notification.userId !== userId && userRole !== "ADMIN") {
      throw new PermissionError(
        "You do not have permission to update this notification"
      );
    }

    return notificationsRepository.markAsRead(notificationId);
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(
    data: MarkNotificationsReadDto,
    userId: string,
    userRole: string
  ): Promise<{ count: number }> {
    // Security check: for non-admins, we need to ensure they only mark their own notifications
    if (userRole !== "ADMIN") {
      // Verify all notifications belong to this user
      for (const id of data.ids) {
        const notification = await notificationsRepository.findById(id);
        if (notification && notification.userId !== userId) {
          throw new PermissionError(
            "You can only mark your own notifications as read"
          );
        }
      }
    }

    return notificationsRepository.markMultipleAsRead(data.ids);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(
    userId: string,
    requestingUserId: string,
    userRole: string
  ): Promise<{ count: number }> {
    // Security check: for non-admins, users can only mark their own notifications
    if (userId !== requestingUserId && userRole !== "ADMIN") {
      throw new PermissionError(
        "You can only mark your own notifications as read"
      );
    }

    return notificationsRepository.markAllAsRead(userId);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const notification = await notificationsRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    // Security check: users can only delete their own notifications
    // unless they are admins
    if (notification.userId !== userId && userRole !== "ADMIN") {
      throw new PermissionError(
        "You do not have permission to delete this notification"
      );
    }

    await notificationsRepository.delete(notificationId);
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(
    userId: string,
    requestingUserId: string,
    userRole: string
  ): Promise<{ count: number }> {
    // Security check: for non-admins, users can only delete their own notifications
    if (userId !== requestingUserId && userRole !== "ADMIN") {
      throw new PermissionError("You can only delete your own notifications");
    }

    return notificationsRepository.deleteAll(userId);
  }

  /**
   * Get notification summary for a user
   */
  async getNotificationSummary(
    userId: string,
    requestingUserId: string,
    userRole: string
  ): Promise<NotificationSummary> {
    // Security check: for non-admins, users can only view their own summary
    if (userId !== requestingUserId && userRole !== "ADMIN") {
      throw new PermissionError(
        "You can only view your own notification summary"
      );
    }

    return notificationsRepository.getSummary(userId);
  }

  /**
   * Send a notification to a user
   * Convenience method that creates and stores a notification
   */
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    relatedType?: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      title,
      message,
      type: type as any, // Type cast to satisfy TypeScript
      relatedId,
      relatedType,
    });
  }
}

// Export a singleton instance
export const notificationsService = new NotificationsService();
