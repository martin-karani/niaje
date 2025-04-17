import { createId } from "@infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// User role enum
export const userRoleEnum = pgEnum("user_role", [
  "agent_owner",
  "agent_staff",
  "property_owner",
  "caretaker",
  "tenant_user",
  "admin",
]);

// User entity
export const userEntity = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  role: userRoleEnum("role").default("agent_staff").notNull(),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Session entity for managing user sessions
export const sessionEntity = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id").references(() => userEntity.id, {
    onDelete: "cascade",
  }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  data: json("data"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Account entity for OAuth providers
export const accountEntity = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => userEntity.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(), // e.g. 'google', 'github'
  accountId: text("account_id").notNull(), // Provider's user ID
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Verification entity for email verification, password reset, etc.
export const verificationEntity = pgTable("verifications", {
  id: text("id").primaryKey().$defaultFn(createId),
  identifier: text("identifier").notNull(), // 'email', 'password-reset', etc.
  value: text("value").notNull(), // Token or code value
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userId: text("user_id").references(() => userEntity.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const userRelations = relations(userEntity, ({ many }) => ({
  sessions: many(sessionEntity),
  accounts: many(accountEntity),
  verifications: many(verificationEntity),
  // Other relations will be defined in their respective domain entities
}));

export const sessionRelations = relations(sessionEntity, ({ one }) => ({
  user: one(userEntity, {
    fields: [sessionEntity.userId],
    references: [userEntity.id],
  }),
}));

export const accountRelations = relations(accountEntity, ({ one }) => ({
  user: one(userEntity, {
    fields: [accountEntity.userId],
    references: [userEntity.id],
  }),
}));

export const verificationRelations = relations(
  verificationEntity,
  ({ one }) => ({
    user: one(userEntity, {
      fields: [verificationEntity.userId],
      references: [userEntity.id],
    }),
  })
);

// Types
export type User = typeof userEntity.$inferSelect;
export type NewUser = typeof userEntity.$inferInsert;
export type Session = typeof sessionEntity.$inferSelect;
export type NewSession = typeof sessionEntity.$inferInsert;
export type Account = typeof accountEntity.$inferSelect;
export type NewAccount = typeof accountEntity.$inferInsert;
export type Verification = typeof verificationEntity.$inferSelect;
export type NewVerification = typeof verificationEntity.$inferInsert;
