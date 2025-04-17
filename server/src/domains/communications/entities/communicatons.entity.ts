import { leaseEntity } from "@/domains/leases/entities/lease.entity";
import { maintenanceRequestsEntity } from "@/domains/maintenance/entities/maintenance-request.entity";
import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { propertyEntity } from "@/domains/properties/entities/property.entity";
import { tenantEntity } from "@/domains/tenants/entities/tenant.entity";
import { userEntity } from "@/domains/users/entities";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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

export const communicationEntity = pgTable("communications", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "cascade" }),

  type: communicationTypeEnum("type").notNull(),
  channel: communicationChannelEnum("channel").notNull(),
  status: communicationStatusEnum("status").default("sent").notNull(),

  senderUserId: text("sender_user_id").references(() => userEntity.id, {
    onDelete: "set null",
  }), // User who sent (if applicable)
  recipientUserId: text("recipient_user_id").references(() => userEntity.id, {
    onDelete: "set null",
  }), // Target user (if applicable)
  recipientTenantId: text("recipient_tenant_id").references(
    () => tenantEntity.id,
    {
      onDelete: "set null",
    }
  ), // Target tenant (if applicable)

  subject: text("subject"), // For emails or notifications
  body: text("body").notNull(), // Message content (HTML or plain text)

  // Related entity links (optional, for context)
  relatedPropertyId: text("related_property_id").references(
    () => propertyEntity.id,
    { onDelete: "set null" }
  ),
  relatedLeaseId: text("related_lease_id").references(() => leaseEntity.id, {
    onDelete: "set null",
  }),
  relatedMaintenanceId: text("related_maintenance_id").references(
    () => maintenanceRequestsEntity.id,
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
export const communicationsRelations = relations(
  communicationEntity,
  ({ one }) => ({
    organization: one(organizationEntity, {
      fields: [communicationEntity.organizationId],
      references: [organizationEntity.id],
    }),
    sender: one(userEntity, {
      fields: [communicationEntity.senderUserId],
      references: [userEntity.id],
      relationName: "sender",
    }),
    recipientUser: one(userEntity, {
      fields: [communicationEntity.recipientUserId],
      references: [userEntity.id],
      relationName: "recipient",
    }),
    recipientTenant: one(tenantEntity, {
      fields: [communicationEntity.recipientTenantId],
      references: [tenantEntity.id],
      relationName: "tenantCommunications",
    }),
    property: one(propertyEntity, {
      fields: [communicationEntity.relatedPropertyId],
      references: [propertyEntity.id],
    }),
    lease: one(leaseEntity, {
      fields: [communicationEntity.relatedLeaseId],
      references: [leaseEntity.id],
    }),
    maintenanceRequest: one(maintenanceRequestsEntity, {
      fields: [communicationEntity.relatedMaintenanceId],
      references: [maintenanceRequestsEntity.id],
    }),
  })
);

// Types
export type Communication = typeof communicationEntity.$inferSelect;
export type NewCommunication = typeof communicationEntity.$inferInsert;
