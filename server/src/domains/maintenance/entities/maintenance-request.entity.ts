import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { propertyEntity } from "@/domains/properties/entities/property.entity";
import { unitEntity } from "@/domains/properties/entities/unit.entity";
import { userEntity } from "@/domains/users/entities/user.entity";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "reported",
  "scheduled",
  "in_progress",
  "on_hold",
  "completed",
  "canceled",
  "requires_owner_approval",
]);

export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const maintenanceCategoryEnum = pgEnum("maintenance_category", [
  "plumbing",
  "electrical",
  "hvac",
  "appliances",
  "structural",
  "landscaping",
  "pest_control",
  "cleaning",
  "other",
]);

export const maintenanceRequestsEntity = pgTable("maintenance_requests", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => propertyEntity.id, { onDelete: "cascade" }),
  unitId: text("unit_id").references(() => unitEntity.id, {
    onDelete: "cascade",
  }),

  status: maintenanceStatusEnum("status").default("reported").notNull(),
  priority: maintenancePriorityEnum("priority").default("medium").notNull(),
  category: maintenanceCategoryEnum("category"),

  title: text("title").notNull(),
  description: text("description").notNull(),

  permissionToEnter: boolean("permission_to_enter").default(false),
  preferredAvailability: text("preferred_availability"),

  reportedBy: text("reported_by")
    .notNull()
    .references(() => userEntity.id, { onDelete: "set null" }),
  assignedTo: text("assigned_to").references(() => userEntity.id, {
    onDelete: "set null",
  }),

  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  completedDate: timestamp("completed_date", { withTimezone: true }),

  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 10, scale: 2 }),

  notes: text("notes"),
  imagesBefore: json("images_before").default([]),
  imagesAfter: json("images_after").default([]),

  vendor: text("vendor"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const maintenanceRequestsRelations = relations(
  maintenanceRequestsEntity,
  ({ one }) => ({
    organization: one(organizationEntity, {
      fields: [maintenanceRequestsEntity.organizationId],
      references: [organizationEntity.id],
    }),
    property: one(propertyEntity, {
      fields: [maintenanceRequestsEntity.propertyId],
      references: [propertyEntity.id],
    }),
    unit: one(unitEntity, {
      fields: [maintenanceRequestsEntity.unitId],
      references: [unitEntity.id],
    }),
    reporter: one(userEntity, {
      fields: [maintenanceRequestsEntity.reportedBy],
      references: [userEntity.id],
      relationName: "maintenanceReporter",
    }),
    assignee: one(userEntity, {
      fields: [maintenanceRequestsEntity.assignedTo],
      references: [userEntity.id],
      relationName: "maintenanceAssignee",
    }),
  })
);

export type MaintenanceRequest = typeof maintenanceRequestsEntity.$inferSelect;
export type NewMaintenanceRequest =
  typeof maintenanceRequestsEntity.$inferInsert;
