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
import { createId } from "../utils";
import { organization } from "./organization";
import { properties } from "./properties";
import { units } from "./units";
import { user } from "./users"; // For reporter and assignee

// Enums
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

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  unitId: text("unit_id").references(() => units.id, { onDelete: "cascade" }), // Optional, if specific to a unit

  status: maintenanceStatusEnum("status").default("reported").notNull(),
  priority: maintenancePriorityEnum("priority").default("medium").notNull(),
  category: maintenanceCategoryEnum("category"),

  title: text("title").notNull(), // Short summary of the issue
  description: text("description").notNull(), // Detailed description
  permissionToEnter: boolean("permission_to_enter").default(false), // Tenant grants permission?
  preferredAvailability: text("preferred_availability"), // Tenant's preferred time

  reportedBy: text("reported_by").references(() => user.id), // User who reported (tenant, caretaker, staff)
  assignedTo: text("assigned_to").references(() => user.id), // User assigned (caretaker, staff)
  vendor: text("vendor"), // External vendor name if applicable

  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  completedDate: timestamp("completed_date", { withTimezone: true }),

  // Cost tracking
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 10, scale: 2 }),

  notes: text("notes"), // Internal notes, updates
  imagesBefore: json("images_before"), // URLs of images before work
  imagesAfter: json("images_after"), // URLs of images after work

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for maintenance requests
export const maintenanceRequestsRelations = relations(
  maintenanceRequests,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [maintenanceRequests.organizationId],
      references: [organization.id],
    }),
    property: one(properties, {
      fields: [maintenanceRequests.propertyId],
      references: [properties.id],
    }),
    unit: one(units, {
      fields: [maintenanceRequests.unitId],
      references: [units.id],
    }),
    reporter: one(user, {
      fields: [maintenanceRequests.reportedBy],
      references: [user.id],
      relationName: "reporter",
    }),
    assignee: one(user, {
      fields: [maintenanceRequests.assignedTo],
      references: [user.id],
      relationName: "assignee",
    }),
    // Could link to expenses table if actual cost creates an expense entry
    // expenses: many(expenses), // This link might be complex to manage directly
  })
);

// Types
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type NewMaintenanceRequest = typeof maintenanceRequests.$inferInsert;
