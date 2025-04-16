import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { leases } from "./leases"; // Related entity
import { maintenanceRequests } from "./maintenance"; // Related entity
import { organization } from "./organization";
import { properties } from "./properties"; // Related entity
import { tenants } from "./tenants"; // Recipient Tenant
import { user } from "./users"; // Sender/Recipient User

// Enums
export const communicationTypeEnum = pgEnum("communication_type", [
  "email",
  "sms",
  "in_app_message",
  "notification",
  "note",
]);
export const communicationChannelEnum = pgEnum("communication_channel", [
  "system_generated",
  "user_sent",
  "tenant_portal",
  "owner_portal",
]);
export const communicationStatusEnum = pgEnum("communication_status", [
  "draft",
  "sent",
  "delivered",
  "read",
  "failed",
  "scheduled",
]);

export const communications = pgTable("communications", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  type: communicationTypeEnum("type").notNull(),
  channel: communicationChannelEnum("channel").notNull(),
  status: communicationStatusEnum("status").default("sent").notNull(),

  senderUserId: text("sender_user_id").references(() => user.id, {
    onDelete: "set null",
  }), // User who sent (if applicable)
  recipientUserId: text("recipient_user_id").references(() => user.id, {
    onDelete: "set null",
  }), // Target user (if applicable)
  recipientTenantId: text("recipient_tenant_id").references(() => tenants.id, {
    onDelete: "set null",
  }), // Target tenant (if applicable)

  subject: text("subject"), // For emails or notifications
  body: text("body").notNull(), // Message content (HTML or plain text)

  // Related entity links (optional, for context)
  relatedPropertyId: text("related_property_id").references(
    () => properties.id,
    { onDelete: "set null" }
  ),
  relatedLeaseId: text("related_lease_id").references(() => leases.id, {
    onDelete: "set null",
  }),
  relatedMaintenanceId: text("related_maintenance_id").references(
    () => maintenanceRequests.id,
    { onDelete: "set null" }
  ),
  // Add other related entities as needed (e.g., relatedPaymentId, relatedInspectionId)

  isRead: boolean("is_read").default(false).notNull(), // If it's a notification/message for a user/tenant
  readAt: timestamp("read_at", { withTimezone: true }),
  scheduledSendAt: timestamp("scheduled_send_at", { withTimezone: true }), // If scheduled
  sentAt: timestamp("sent_at", { withTimezone: true }), // Actual send time
  deliveredAt: timestamp("delivered_at", { withTimezone: true }), // Delivery confirmation time (if available)
  failedReason: text("failed_reason"), // If status is 'failed'

  metadata: json("metadata"), // e.g., email headers, SMS SID
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for communications
export const communicationsRelations = relations(communications, ({ one }) => ({
  organization: one(organization, {
    fields: [communications.organizationId],
    references: [organization.id],
  }),
  sender: one(user, {
    fields: [communications.senderUserId],
    references: [user.id],
    relationName: "sender",
  }),
  recipientUser: one(user, {
    fields: [communications.recipientUserId],
    references: [user.id],
    relationName: "recipient",
  }),
  recipientTenant: one(tenants, {
    fields: [communications.recipientTenantId],
    references: [tenants.id],
    relationName: "tenantCommunications",
  }),
  property: one(properties, {
    fields: [communications.relatedPropertyId],
    references: [properties.id],
  }),
  lease: one(leases, {
    fields: [communications.relatedLeaseId],
    references: [leases.id],
  }),
  maintenanceRequest: one(maintenanceRequests, {
    fields: [communications.relatedMaintenanceId],
    references: [maintenanceRequests.id],
  }),
}));

// Types
export type Communication = typeof communications.$inferSelect;
export type NewCommunication = typeof communications.$inferInsert;
