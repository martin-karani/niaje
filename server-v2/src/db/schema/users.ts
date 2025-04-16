import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";

import { communications } from "./communication";
import { documents } from "./documents";
import { inspections } from "./inspections";
import { leases } from "./leases"; // For creator
import { maintenanceRequests } from "./maintenance"; // For reporter/assignee
import { member, organization } from "./organization"; // For staff relationships
import { properties } from "./properties"; // For owner/caretaker relationships

export const userRoleEnum = pgEnum("user_role", [
  "agent_owner",
  "agent_staff",
  "property_owner",
  "caretaker",
  "tenant_user",
  "admin",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(createId), // Use defaultFn for createId
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  passwordHash: text("password_hash"), // Store hashed passwords if using email/password auth
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull(), // Use the enum
  isActive: boolean("is_active").default(true).notNull(),
  address: text("address"), // Could be JSON for structured address
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

// Define relations for users
export const userRelations = relations(user, ({ many, one }) => ({
  // If user is an agent owner, the orgs they own
  ownedOrganizations: many(organization, { relationName: "agentOwner" }),
  // If user is staff, the org memberships they have
  organizationMemberships: many(member),
  // If user is a property owner, the properties they own
  ownedProperties: many(properties, { relationName: "propertyOwner" }),
  // If user is a caretaker, the properties they manage
  caretakerProperties: many(properties, { relationName: "propertyCaretaker" }),
  // Maintenance requests reported or assigned
  reportedMaintenanceRequests: many(maintenanceRequests, {
    relationName: "reporter",
  }),
  assignedMaintenanceRequests: many(maintenanceRequests, {
    relationName: "assignee",
  }),
  // Inspections conducted
  conductedInspections: many(inspections, { relationName: "inspector" }),
  // Leases created (likely by agent staff)
  createdLeases: many(leases, { relationName: "leaseCreator" }),
  // Communications sent/received
  sentCommunications: many(communications, { relationName: "sender" }),
  receivedCommunications: many(communications, { relationName: "recipient" }),
  // Documents uploaded
  uploadedDocuments: many(documents, { relationName: "uploader" }),

  // Auth accounts (e.g., Google, password) - Assuming accounts schema exists
  accounts: many(account), // Need to define 'account' table separately
  // Sessions - Assuming sessions schema exists
  sessions: many(session), // Need to define 'session' table separately
}));

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),
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
      // Use uniqueIndex instead of index().unique()
      providerAccountIdx: uniqueIndex("provider_account_idx").on(
        table.providerId,
        table.accountId
      ),
    };
  }
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  data: json("data"),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    identifier: text("identifier").notNull(), // e.g., 'email', 'password-reset'
    value: text("value").notNull().unique(), // The actual token/code
    expiresAt: timestamp("expires_at").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
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

export const verificationRelations = relations(verification, ({ one }) => ({
  user: one(user, {
    fields: [verification.userId],
    references: [user.id],
  }),
}));

// Types
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

// Types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
