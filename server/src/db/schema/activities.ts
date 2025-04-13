import { relations } from "drizzle-orm";
import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { units } from "./properties";
import { users } from "./users";

export const activities = pgTable("activities", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(), // "changed_status", "created_work_order", etc.
  entityType: text("entity_type").notNull(), // "maintenance_request", "work_order"
  entityId: text("entity_id").notNull(), // The ID of the related entity
  unitId: text("unit_id").references(() => units.id),
  previousStatus: text("previous_status"), // For status changes
  newStatus: text("new_status"), // For status changes
  metadata: json("metadata"), // Additional data about the action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  unit: one(units, {
    fields: [activities.unitId],
    references: [units.id],
  }),
}));

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
