import { z } from "zod";

// Define enums for validation
const messageTypeEnum = z.enum(["sms", "email"]);
const messageStatusEnum = z.enum(["sent", "failed", "pending"]);
const deliveryStatusEnum = z.enum(["delivered", "failed", "pending"]);

// DTO for sending a message
export const sendMessageDto = z.object({
  tenantIds: z.array(z.string()).min(1, "At least one tenant must be selected"),
  messageType: messageTypeEnum,
  messageText: z.string().min(1, "Message text is required"),
  subject: z.string().optional(), // Only required for email
  propertyId: z.string().optional(),
});

// DTO for message ID parameter
export const messageIdDto = z.object({
  id: z.string().min(1, "Message ID is required"),
});

// DTO for filtering messages
export const messageFilterDto = z.object({
  propertyId: z.string().optional(),
  type: messageTypeEnum.optional(),
  status: messageStatusEnum.optional(),
  search: z.string().optional(),
  dateFrom: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  dateTo: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

// DTO for creating/updating a message template
export const messageTemplateDto = z.object({
  name: z.string().min(1, "Template name is required"),
  type: messageTypeEnum,
  subject: z.string().optional(), // Only required for email
  content: z.string().min(1, "Template content is required"),
  isGlobal: z.boolean().optional().default(false),
  propertyId: z.string().optional(),
});

// DTO for template ID parameter
export const templateIdDto = z.object({
  id: z.string().min(1, "Template ID is required"),
});

// Export TypeScript types
export type SendMessageDto = z.infer<typeof sendMessageDto>;
export type MessageIdDto = z.infer<typeof messageIdDto>;
export type MessageFilterDto = z.infer<typeof messageFilterDto>;
export type MessageTemplateDto = z.infer<typeof messageTemplateDto>;
export type TemplateIdDto = z.infer<typeof templateIdDto>;
