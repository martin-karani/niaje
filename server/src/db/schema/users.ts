import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "../utils";

// Create enum for user roles
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

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
