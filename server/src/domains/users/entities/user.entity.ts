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

// === OAuth Entities ===

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

// === Verification Entities ===

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

// === Token Entities ===

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

// Organization entity
export const organizationEntity = pgTable("organizations", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),

  // Agent owner (user who created the organization)
  agentOwnerId: text("agent_owner_id").references(() => userEntity.id, {
    onDelete: "set null",
  }),

  // Trial information
  trialStatus: trialStatusEnum("trial_status").default("not_started"),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialExpiresAt: timestamp("trial_expires_at", { withTimezone: true }),

  // Subscription information
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default(
    "none"
  ),
  subscriptionPlan: text("subscription_plan"),
  subscriptionId: text("subscription_id"),
  customerId: text("customer_id"), // Customer ID in payment provider

  // Limits (based on subscription plan)
  maxProperties: text("max_properties").default("5"),
  maxUsers: text("max_users").default("3"),
  logo: text("logo"),
  address: text("address"),

  // Custom metadata
  metadata: json("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Team entity for organizing users within an organization
export const teamEntity = pgTable("teams", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "cascade" }),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Member role enum
export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
  "caretaker",
  "property_owner",
  "tenant",
]);

// Member status enum
export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "pending",
  "rejected",
]);

// Organization member entity - junction table for users and organizations
export const memberEntity = pgTable("members", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => userEntity.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teamEntity.id, {
    onDelete: "set null",
  }),
  role: memberRoleEnum("role").default("member").notNull(),
  status: memberStatusEnum("status").default("active").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Invitation status enum
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

// Invitation entity for inviting users to an organization
export const invitationEntity = pgTable("invitations", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: memberRoleEnum("role").default("member").notNull(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  token: text("token").notNull().unique(),
  teamId: text("team_id").references(() => teamEntity.id, {
    onDelete: "set null",
  }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  inviterId: text("inviter_id").references(() => userEntity.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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

// Verification relations
export const verificationRelations = relations(
  verificationEntity,
  ({ one }) => ({
    user: one(userEntity, {
      fields: [verificationEntity.userId],
      references: [userEntity.id],
    }),
  })
);

// Token relations
export const tokenRelations = relations(tokenEntity, ({ one }) => ({
  user: one(userEntity, {
    fields: [tokenEntity.userId],
    references: [userEntity.id],
  }),
}));

// Organization relations
export const organizationRelations = relations(
  organizationEntity,
  ({ one, many }) => ({
    agentOwner: one(userEntity, {
      fields: [organizationEntity.agentOwnerId],
      references: [userEntity.id],
    }),
    members: many(memberEntity),
    teams: many(teamEntity),
    invitations: many(invitationEntity),
  })
);

// Team relations
export const teamRelations = relations(teamEntity, ({ one, many }) => ({
  organization: one(organizationEntity, {
    fields: [teamEntity.organizationId],
    references: [organizationEntity.id],
  }),
  members: many(memberEntity),
  invitations: many(invitationEntity),
}));

// Member relations
export const memberRelations = relations(memberEntity, ({ one }) => ({
  organization: one(organizationEntity, {
    fields: [memberEntity.organizationId],
    references: [organizationEntity.id],
  }),
  user: one(userEntity, {
    fields: [memberEntity.userId],
    references: [userEntity.id],
  }),
  team: one(teamEntity, {
    fields: [memberEntity.teamId],
    references: [teamEntity.id],
  }),
}));

// Invitation relations
export const invitationRelations = relations(invitationEntity, ({ one }) => ({
  organization: one(organizationEntity, {
    fields: [invitationEntity.organizationId],
    references: [organizationEntity.id],
  }),
  inviter: one(userEntity, {
    fields: [invitationEntity.inviterId],
    references: [userEntity.id],
    relationName: "inviter",
  }),
  team: one(teamEntity, {
    fields: [invitationEntity.teamId],
    references: [teamEntity.id],
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
export type Organization = typeof organizationEntity.$inferSelect;
export type NewOrganization = typeof organizationEntity.$inferInsert;
export type Team = typeof teamEntity.$inferSelect;
export type NewTeam = typeof teamEntity.$inferInsert;
export type Member = typeof memberEntity.$inferSelect;
export type NewMember = typeof memberEntity.$inferInsert;
export type Invitation = typeof invitationEntity.$inferSelect;
export type NewInvitation = typeof invitationEntity.$inferInsert;
