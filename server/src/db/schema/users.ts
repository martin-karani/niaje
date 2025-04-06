import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "../utils";
// import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "LANDLORD",
  "CARETAKER",
  "AGENT",
  "ADMIN",
]);

// Define users table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  phone: text("phone"),
  role: userRoleEnum("role").default("LANDLORD").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// // Define relations for the users table
// export const usersRelations = relations(users, ({ many, one }) => ({
//   // One-to-many relations where user is an owner of properties
//   ownedProperties: many(/* properties table will be imported later */),

//   // One-to-many relations where user is a caretaker of properties
//   managedProperties: many(/* properties table will be imported later */),

//   // One-to-many relations where user is an agent for properties
//   representedProperties: many(/* properties table will be imported later */),

//   // One-to-many relation with accounts
//   accounts: many(/* accounts table will be imported later */),

//   // One-to-many relation with sessions
//   sessions: many(/* sessions table will be imported later */),

//   // One-to-many relation with verifications
//   verifications: many(/* verifications table will be imported later */),
// }));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
