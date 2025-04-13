import { relations } from "drizzle-orm";
import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { properties } from "./properties";
import { tenants, users } from "./users";

// Messages table
export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(createId),
  propertyId: text("property_id").references(() => properties.id),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // "sms" or "email"
  subject: text("subject"), // Only for email messages
  content: text("content").notNull(),
  status: text("status").notNull(), // "sent", "failed", "pending"
  recipientCount: text("recipient_count").notNull(), // Number of recipients
  metadata: json("metadata"), // For storing delivery statuses, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Message recipients junction table
export const messageRecipients = pgTable("message_recipients", {
  id: text("id").primaryKey().$defaultFn(createId),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id),
  deliveryStatus: text("delivery_status").notNull(), // "delivered", "failed", "pending"
  errorMessage: text("error_message"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Message templates table
export const messageTemplates = pgTable("message_templates", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  type: text("type").notNull(), // "sms" or "email"
  subject: text("subject"), // Only for email templates
  content: text("content").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  isGlobal: text("is_global").notNull().default("false"), // Whether this template is available to all users
  propertyId: text("property_id").references(() => properties.id), // Optional property-specific template
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
  property: one(properties, {
    fields: [messages.propertyId],
    references: [properties.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipients: many(messageRecipients),
}));

export const messageRecipientsRelations = relations(
  messageRecipients,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageRecipients.messageId],
      references: [messages.id],
    }),
    tenant: one(tenants, {
      fields: [messageRecipients.tenantId],
      references: [tenants.id],
    }),
  })
);

export const messageTemplatesRelations = relations(
  messageTemplates,
  ({ one }) => ({
    creator: one(users, {
      fields: [messageTemplates.createdBy],
      references: [users.id],
    }),
    property: one(properties, {
      fields: [messageTemplates.propertyId],
      references: [properties.id],
    }),
  })
);

// Types
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageRecipient = typeof messageRecipients.$inferSelect;
export type NewMessageRecipient = typeof messageRecipients.$inferInsert;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type NewMessageTemplate = typeof messageTemplates.$inferInsert;
