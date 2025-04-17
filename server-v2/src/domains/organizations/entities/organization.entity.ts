import { userEntity } from "@domains/users/entities/user.entity";
import { createId } from "@infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Enum for trial status
export const trialStatusEnum = pgEnum("trial_status", [
  "active",
  "expired",
  "converted",
  "not_started",
]);

// Enum for subscription status
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
  maxProperties: integer("max_properties").default(5),
  maxUsers: integer("max_users").default(3),

  // Organization settings
  timezone: text("timezone").default("UTC"),
  currency: text("currency").default("USD"),
  dateFormat: text("date_format").default("YYYY-MM-DD"),
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
  role: text("role").notNull(), // 'owner', 'admin', 'member', etc.
  status: text("status").default("active").notNull(), // 'active', 'inactive', 'pending', etc.
  joinedAt: timestamp("joined_at", { withTimezone: true }),
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

// Invitation entity for inviting users to an organization
export const invitationEntity = pgTable("invitations", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'accepted', 'expired', 'revoked'
  token: text("token").notNull(),
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

// Relations
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

export const teamRelations = relations(teamEntity, ({ one, many }) => ({
  organization: one(organizationEntity, {
    fields: [teamEntity.organizationId],
    references: [organizationEntity.id],
  }),
  members: many(memberEntity),
}));

export const invitationRelations = relations(invitationEntity, ({ one }) => ({
  organization: one(organizationEntity, {
    fields: [invitationEntity.organizationId],
    references: [organizationEntity.id],
  }),
  inviter: one(userEntity, {
    fields: [invitationEntity.inviterId],
    references: [userEntity.id],
  }),
}));

// Types
export type Organization = typeof organizationEntity.$inferSelect;
export type NewOrganization = typeof organizationEntity.$inferInsert;
export type Member = typeof memberEntity.$inferSelect;
export type NewMember = typeof memberEntity.$inferInsert;
export type Team = typeof teamEntity.$inferSelect;
export type NewTeam = typeof teamEntity.$inferInsert;
export type Invitation = typeof invitationEntity.$inferSelect;
export type NewInvitation = typeof invitationEntity.$inferInsert;
