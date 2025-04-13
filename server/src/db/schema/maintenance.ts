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
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  assignedTo: text("assigned_to").references(() => users.id), // Caretaker
  resolvedAt: timestamp("resolved_at"),
  cost: numeric("cost"),
  images: json("images"), // Array of image URLs
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

// Add relation to maintenanceRequests if needed
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
  })
);

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
