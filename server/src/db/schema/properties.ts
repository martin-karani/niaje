import { pgTable, text, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { users } from "./users";

// Define properties table
export const properties = pgTable("properties", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // Apartment, House, Commercial, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  caretakerId: text("caretaker_id").references(() => users.id),
  agentId: text("agent_id").references(() => users.id),
});

// Types
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
