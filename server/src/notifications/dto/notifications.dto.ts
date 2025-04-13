import { z } from "zod";

// Define notification types
export const NotificationTypeEnum = z.enum([
  "payment_due",
  "payment_received",
  "maintenance",
  "lease",
  "utility_bill",
  "system",
]);

// Base schema for creating notifications
const notificationBaseSchema = {
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: NotificationTypeEnum,
  relatedId: z.string().optional().nullable(),
  relatedType: z.string().optional().nullable(),
};

// DTO for creating a new notification
export const createNotificationDto = z.object({
  ...notificationBaseSchema,
});

// DTO for updating a notification (mainly for marking as read)
export const updateNotificationDto = z.object({
  id: z.string(),
  isRead: z.boolean(),
});

// DTO for notification ID parameter
export const notificationIdDto = z.object({
  id: z.string(),
});

// DTO for filtering notifications
export const notificationFilterDto = z.object({
  userId: z.string().optional(),
  type: NotificationTypeEnum.optional(),
  isRead: z.boolean().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

// DTO for bulk marking notifications as read
export const markNotificationsReadDto = z.object({
  ids: z.array(z.string()),
});

// DTO for creating a notification template
export const createNotificationTemplateDto = z.object({
  name: z.string().min(1, "Template name is required"),
  type: NotificationTypeEnum,
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  isActive: z.boolean().default(true),
});

// Export TypeScript types
export type CreateNotificationDto = z.infer<typeof createNotificationDto>;
export type UpdateNotificationDto = z.infer<typeof updateNotificationDto>;
export type NotificationIdDto = z.infer<typeof notificationIdDto>;
export type NotificationFilterDto = z.infer<typeof notificationFilterDto>;
export type MarkNotificationsReadDto = z.infer<typeof markNotificationsReadDto>;
export type CreateNotificationTemplateDto = z.infer<
  typeof createNotificationTemplateDto
>;
