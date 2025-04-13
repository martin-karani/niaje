import { db } from "@/db";
import { notifications } from "@/db/schema";
import { NotificationFilterDto } from "@/notifications/dto/notifications.dto";
import {
  Notification,
  NotificationSummary,
  NotificationTemplate,
  NotificationWithUser,
} from "@/notifications/types";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { CreateNotificationDto } from "../dto/notifications.dto";

export class NotificationsRepository {
  /**
   * Find all notifications with optional filtering
   */
  async findAll(
    filters?: NotificationFilterDto
  ): Promise<NotificationWithUser[]> {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(notifications.userId, filters.userId));
    }

    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type));
    }

    if (filters?.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, filters.isRead));
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return db.query.notifications.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
          relationName: "notificationRecipient",
        },
      },
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    });
  }

  /**
   * Count notifications with filters (for pagination)
   */
  async countNotifications(
    filters?: Omit<NotificationFilterDto, "page" | "limit">
  ): Promise<number> {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(notifications.userId, filters.userId));
    }

    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type));
    }

    if (filters?.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, filters.isRead));
    }

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a notification by ID
   */
  async findById(id: string): Promise<Notification | null> {
    return db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
  }

  /**
   * Create a new notification
   */
  async create(notificationData: CreateNotificationDto): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...notificationData,
        isRead: false,
      })
      .returning();

    return notification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.id, id))
      .returning();

    return notification;
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(ids: string[]): Promise<{ count: number }> {
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(inArray(notifications.id, ids));

    return { count: result.rowCount || 0 };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );

    return { count: result.rowCount || 0 };
  }

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAll(userId: string): Promise<{ count: number }> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));

    return { count: result.rowCount || 0 };
  }

  /**
   * Get notification summary for a user
   */
  async getSummary(userId: string): Promise<NotificationSummary> {
    // Get total unread count
    const [unreadResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );

    // Get counts by type
    const byTypeResult = await db
      .select({
        type: notifications.type,
        count: count(),
      })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      )
      .groupBy(notifications.type);

    return {
      totalUnread: unreadResult.count,
      byType: byTypeResult.map((r) => ({
        type: r.type,
        count: Number(r.count),
      })),
    };
  }

  /**
   * Create notification templates methods would go here if we had a table for them
   * For now, we'll leave them as placeholders
   */
  async createTemplate(template: any): Promise<NotificationTemplate> {
    // Placeholder
    throw new Error("Not implemented");
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    // Placeholder
    return [];
  }
}

// Export a singleton instance
export const notificationsRepository = new NotificationsRepository();
