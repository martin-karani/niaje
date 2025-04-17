import { relations } from "drizzle-orm";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { documents } from "./documents"; // For org-level documents
import { expenses } from "./payments"; // For org-level expenses
import { properties } from "./properties";
import { user, userRoleEnum } from "./users"; // Import users and the enum

// Enums for statuses
export const trialStatusEnum = pgEnum("trial_status", [
  "active",
  "expired",
  "converted",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

// Define organization table - Represents the Agent's Business
export const organization = pgTable("organization", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(), // Name of the Agent's Business
  slug: text("slug").unique().notNull(),
  logo: text("logo"), // URL or path to logo
  agentOwnerId: text("agent_owner_id") // The primary agent user who owns this org
    .notNull()
    .references(() => user.id),

  // Trial fields
  trialStatus: trialStatusEnum("trial_status").default("active").notNull(),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  trialExpiresAt: timestamp("trial_expires_at", { withTimezone: true }),

  // Subscription fields
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .default("trialing")
    .notNull(),
  subscriptionPlan: text("subscription_plan"), // e.g., 'basic', 'standard', 'premium'
  subscriptionId: text("subscription_id"), // ID from payment processor (e.g., Stripe Subscription ID, Flutterwave Transaction ID for latest sub)
  subscriptionRenewsAt: timestamp("subscription_renews_at", {
    withTimezone: true,
  }),
  subscriptionPeriodEndsAt: timestamp("subscription_period_ends_at", {
    withTimezone: true,
  }), // When current paid period ends

  // Payment info
  customerId: text("customer_id"), // ID from payment processor (e.g., Stripe Customer ID)

  // Usage limits based on plan
  maxProperties: integer("max_properties").default(5).notNull(),
  maxUsers: integer("max_users").default(3).notNull(), // Represents agent_staff members

  // Configuration / Settings
  timezone: text("timezone").default("UTC").notNull(),
  currency: text("currency").default("KES").notNull(), // Default currency like Kenyan Shilling
  dateFormat: text("date_format").default("YYYY-MM-DD"),
  address: text("address"), // Business Address

  // Other fields
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define team table (for organizing staff within the Agent's organization)
export const team = pgTable("team", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define member (join table between users (staff) and the Agent's organization)
export const member = pgTable("member", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id") // Staff user ID
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull(), // Should be 'agent_staff' or maybe 'admin' within the org context
  teamId: text("team_id").references(() => team.id, { onDelete: "set null" }), // Set null if team deleted
  status: text("status").default("active").notNull(), // active, inactive, pending_invite
  joinedAt: timestamp("joined_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Example: src/db/schema/invitation.ts (For inviting staff, simplified from context)
export const invitation = pgTable("invitation", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull(), // Role they will have upon accepting
  status: text("status").default("pending").notNull(), // pending, accepted, expired, revoked
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  inviterId: text("inviter_id") // User who sent the invite
    .notNull()
    .references(() => user.id), // No cascade delete here
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations for organization
export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    agentOwner: one(user, {
      fields: [organization.agentOwnerId],
      references: [user.id],
      relationName: "agentOwner", // Explicit relation name
    }),
    members: many(member), // Staff members
    teams: many(team),
    managedProperties: many(properties), // Properties managed by this org
    invitations: many(invitation), // Staff invitations sent by this org
    documents: many(documents, { relationName: "organizationDocuments" }), // Org-level documents
    expenses: many(expenses, { relationName: "organizationExpenses" }), // Org-level expenses
  })
);

// Relations for team
export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  members: many(member),
}));

// Relations for member (Staff)
export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    // The staff user
    fields: [member.userId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [member.teamId],
    references: [team.id],
  }),
}));

// Relations for invitation
export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// Types
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
export type Team = typeof team.$inferSelect;
export type NewTeam = typeof team.$inferInsert;
export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
