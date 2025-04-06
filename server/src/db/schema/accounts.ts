import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { users } from "./users";
import { relations } from "drizzle-orm";

// Define accounts table with a unique index
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(), // e.g., 'google', 'github', 'emailpassword'
    accountId: text("account_id").notNull(), // Provider's unique ID for the user or userId for credentials
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      providerAccountIdx: index("provider_account_idx")
        .on(table.providerId, table.accountId)
        .unique(),
    };
  }
);

// Define relations for the accounts table
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Types
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
