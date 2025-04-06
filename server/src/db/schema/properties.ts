import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { users } from "./users";

// Define properties table
export const properties = pgTable("properties", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  caretakerId: text("caretaker_id").references(() => users.id),
  agentId: text("agent_id").references(() => users.id),
});

// Define relations for properties table
export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
    relationName: "propertyOwner",
  }),
  caretaker: one(users, {
    fields: [properties.caretakerId],
    references: [users.id],
    relationName: "propertyCaretaker",
  }),
  agent: one(users, {
    fields: [properties.agentId],
    references: [users.id],
    relationName: "propertyAgent",
  }),
}));

// Types
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
