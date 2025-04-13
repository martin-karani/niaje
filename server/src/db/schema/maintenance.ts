import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { units } from "./properties";
import { tenants, users } from "./users";

// First, declare both tables without circular references
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: text("id").primaryKey().$defaultFn(createId),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id),
  tenantId: text("tenant_id").references(() => tenants.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium").notNull(), // low, medium, high, emergency
  status: text("status").default("open").notNull(), // open, in_progress, completed
  workOrderId: text("work_order_id"), // We'll add the reference in relations
  reportedAt: timestamp("reported_at").defaultNow().notNull(),

  // Internal assignee (user in the system)
  assignedTo: text("assigned_to").references(() => users.id), // Optional reference to internal user

  // External assignee fields (used when assignedTo is null)
  assignedToName: text("assigned_to_name"), // Name of external assignee
  assignedToPhone: text("assigned_to_phone"), // Phone of external assignee
  assignedToEmail: text("assigned_to_email"), // Optional email of external assignee

  resolvedAt: timestamp("resolved_at"),
  cost: numeric("cost"),
  images: json("images"), // Array of image URLs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workOrders = pgTable("work_orders", {
  id: text("id").primaryKey().$defaultFn(createId),
  requestId: text("request_id"), // We'll add the reference in relations
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("normal").notNull(), // low, normal, high, urgent
  status: text("status").default("pending").notNull(), // pending, assigned, completed, canceled
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id),
  tenantId: text("tenant_id").references(() => tenants.id),

  // Internal assignee (user in the system)
  assignedTo: text("assigned_to").references(() => users.id), // Optional reference to internal user

  // External assignee fields (used when assignedTo is null)
  assignedToName: text("assigned_to_name"), // Name of external assignee
  assignedToPhone: text("assigned_to_phone"), // Phone of external assignee (required for external)
  assignedToEmail: text("assigned_to_email"), // Optional email of external assignee

  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  category: text("category"),
  cost: numeric("cost"),
  images: json("images"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maintenance comments table
export const maintenanceComments = pgTable("maintenance_comments", {
  id: text("id").primaryKey().$defaultFn(createId),
  requestId: text("request_id")
    .notNull()
    .references(() => maintenanceRequests.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maintenance categories table
export const maintenanceCategories = pgTable("maintenance_categories", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  description: text("description"),
  isCommon: boolean("is_common").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const maintenanceCommentsRelations = relations(
  maintenanceComments,
  ({ one }) => ({
    request: one(maintenanceRequests, {
      fields: [maintenanceComments.requestId],
      references: [maintenanceRequests.id],
    }),
    user: one(users, {
      fields: [maintenanceComments.userId],
      references: [users.id],
    }),
  })
);

// Now add the relations with the circular references
export const maintenanceRequestsRelations = relations(
  maintenanceRequests,
  ({ one, many }) => ({
    unit: one(units, {
      fields: [maintenanceRequests.unitId],
      references: [units.id],
    }),
    tenant: one(tenants, {
      fields: [maintenanceRequests.tenantId],
      references: [tenants.id],
    }),
    assignee: one(users, {
      fields: [maintenanceRequests.assignedTo],
      references: [users.id],
      relationName: "maintenanceAssignee",
    }),
    comments: many(maintenanceComments),
    workOrder: one(workOrders, {
      fields: [maintenanceRequests.workOrderId],
      references: [workOrders.id],
    }),
  })
);

export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  maintenanceRequest: one(maintenanceRequests, {
    fields: [workOrders.requestId],
    references: [maintenanceRequests.id],
  }),
  unit: one(units, {
    fields: [workOrders.unitId],
    references: [units.id],
  }),
  tenant: one(tenants, {
    fields: [workOrders.tenantId],
    references: [tenants.id],
  }),
  assignee: one(users, {
    fields: [workOrders.assignedTo],
    references: [users.id],
  }),
}));

export const maintenanceCategoriesRelations = relations(
  maintenanceCategories,
  ({ many }) => ({
    requests: many(maintenanceRequests),
  })
);

// Types
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type NewMaintenanceRequest = typeof maintenanceRequests.$inferInsert;
export type MaintenanceComment = typeof maintenanceComments.$inferSelect;
export type NewMaintenanceComment = typeof maintenanceComments.$inferInsert;
export type MaintenanceCategory = typeof maintenanceCategories.$inferSelect;
export type NewMaintenanceCategory = typeof maintenanceCategories.$inferInsert;
export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;
