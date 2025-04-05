import {
  pgTable,
  text,
  timestamp,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { users } from "./users";

// Define verifications table
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    identifier: text("identifier").notNull(), // e.g., 'email', 'password-reset'
    value: text("value").notNull().unique(), // The actual token/code
    expiresAt: timestamp("expires_at").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      identifierValueIdx: index("identifier_value_idx").on(
        table.identifier,
        table.value
      ),
    };
  }
);

// Types
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
