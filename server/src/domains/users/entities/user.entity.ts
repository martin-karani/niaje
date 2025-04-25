import {
  invitationEntity,
  memberEntity,
} from "@/domains/organizations/entities";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// User entity
export const userEntity = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
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
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  impersonatedBy: text("impersonated_by"), // User(Admin) ID of the impersonator
  data: json("data"), // Store activeOrganizationId, activeTeamId, etc.
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

// Verification type enum
export const verificationTypeEnum = pgEnum("verification_type", [
  "email_verification",
  "password_reset",
  "email_change",
  "account_deletion",
]);

// Verification entity for email verification, password reset, etc.
export const verificationEntity = pgTable("verifications", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id").references(() => userEntity.id, {
    onDelete: "cascade",
  }),
  token: text("token").notNull().unique(),
  type: verificationTypeEnum("type").notNull(),
  email: text("email"), // For email change verifications
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Token type enum
export const tokenTypeEnum = pgEnum("token_type", [
  "access",
  "refresh",
  "api_key",
]);

// Token entity for API keys and refresh tokens
export const tokenEntity = pgTable("tokens", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id").references(() => userEntity.id, {
    onDelete: "cascade",
  }),
  type: tokenTypeEnum("type").notNull(),
  token: text("token").notNull().unique(),
  name: text("name"), // For API keys
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Organization trial status enum
export const trialStatusEnum = pgEnum("trial_status", [
  "active",
  "expired",
  "converted",
  "not_started",
]);

// Organization subscription status enum
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
]);

// User relations
export const userRelations = relations(userEntity, ({ many }) => ({
  sessions: many(sessionEntity),
  accounts: many(accountEntity),
  verifications: many(verificationEntity),
  tokens: many(tokenEntity),
  organizations: many(memberEntity),
  invitations: many(invitationEntity, { relationName: "inviter" }),
}));

// Session relations
export const sessionRelations = relations(sessionEntity, ({ one }) => ({
  user: one(userEntity, {
    fields: [sessionEntity.userId],
    references: [userEntity.id],
  }),
}));

// Account relations
export const accountRelations = relations(accountEntity, ({ one }) => ({
  user: one(userEntity, {
    fields: [accountEntity.userId],
    references: [userEntity.id],
  }),
}));

// Token relations
export const tokenRelations = relations(tokenEntity, ({ one }) => ({
  user: one(userEntity, {
    fields: [tokenEntity.userId],
    references: [userEntity.id],
  }),
}));

// Export types
export type User = typeof userEntity.$inferSelect;
export type NewUser = typeof userEntity.$inferInsert;
export type Session = typeof sessionEntity.$inferSelect;
export type NewSession = typeof sessionEntity.$inferInsert;
export type Account = typeof accountEntity.$inferSelect;
export type NewAccount = typeof accountEntity.$inferInsert;
export type Verification = typeof verificationEntity.$inferSelect;
export type NewVerification = typeof verificationEntity.$inferInsert;
export type Token = typeof tokenEntity.$inferSelect;
export type NewToken = typeof tokenEntity.$inferInsert;

export type Member = typeof memberEntity.$inferSelect;
export type NewMember = typeof memberEntity.$inferInsert;
export type Invitation = typeof invitationEntity.$inferSelect;
export type NewInvitation = typeof invitationEntity.$inferInsert;
export type VerificationType = (typeof verificationTypeEnum.enumValues)[number];
export type TokenType = (typeof tokenTypeEnum.enumValues)[number];
export type TrialStatus = (typeof trialStatusEnum.enumValues)[number];
export type SubscriptionStatus =
  (typeof subscriptionStatusEnum.enumValues)[number];
