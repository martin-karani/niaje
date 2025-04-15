// src/db/schema/tenants.ts
import { relations } from "drizzle-orm";
import {
    boolean,
    date,
    pgEnum,
    pgTable,
    text,
    timestamp
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { communications } from "./communication"; // For communications involving the tenant
import { documents } from "./documents"; // For tenant-specific documents
import { leases } from "./leases"; // Link to leases they are part of
import { organization } from "./organization"; // Link tenant to the managing org
import { payments } from "./payments"; // Link to payments made by the tenant
import { user } from "./users"; // Optional link if tenant has a user portal account

// Enums for tenant status
export const tenantStatusEnum = pgEnum('tenant_status', ['prospect', 'active', 'past', 'rejected', 'blacklisted']);

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id") // Link to the Agent's Org that manages this tenant
    .notNull()
    .references(() => organization.id, { onDelete: 'restrict' }), // Don't delete org if tenants exist
  userId: text("user_id").references(() => user.id, { onDelete: 'set null' }), // Optional link to a user account for portal access

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(), // Can be non-unique here if multiple tenants share email without portal access
  phone: text("phone"),
  status: tenantStatusEnum("status").default("active").notNull(),

  dateOfBirth: date("date_of_birth"), // Use 'date' type
  occupation: text("occupation"),
  employer: text("employer"),
  income: numeric("income"), // Optional income info

  // Emergency Contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactRelation: text("emergency_contact_relation"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactEmail: text("emergency_contact_email"),

  // Move-in / Move-out
  expectedMoveInDate: date("expected_move_in_date"),
  actualMoveInDate: date("actual_move_in_date"),
  expectedMoveOutDate: date("expected_move_out_date"), // From lease notice
  actualMoveOutDate: date("actual_move_out_date"),

  notes: text("notes"), // Internal notes about the tenant
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Intermediate table for Many-to-Many between Leases and Tenants
export const leaseTenants = pgTable("lease_tenants", {
   id: text("id").primaryKey().$defaultFn(createId),
   leaseId: text("lease_id")
     .notNull()
     .references(() => leases.id, { onDelete: "cascade" }),
   tenantId: text("tenant_id")
     .notNull()
     .references(() => tenants.id, { onDelete: "cascade" }),
   isPrimary: boolean("is_primary").default(true).notNull(), // Is this the primary tenant on the lease?
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


// Define relations for tenants
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  organization: one(organization, {
    fields: [tenants.organizationId],
    references: [organization.id],
  }),
  userAccount: one(user, { // Link to their user portal account, if exists
    fields: [tenants.userId],
    references: [user.id],
  }),
  leaseAssignments: many(leaseTenants), // Through the join table
  payments: many(payments), // Payments made by this tenant
  documents: many(documents, { relationName: "tenantDocuments" }), // Documents related to this tenant
  communications: many(communications, { relationName: "tenantCommunications" }), // Communications involving this tenant
}));


// Define relations for the join table LeaseTenants
export const leaseTenantsRelations = relations(leaseTenants, ({ one }) => ({
  lease: one(leases, {
    fields: [leaseTenants.leaseId],
    references: [leases.id],
  }),
  tenant: one(tenants, {
    fields: [leaseTenants.tenantId],
    references: [tenants.id],
  }),
}));


// Types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type LeaseTenant = typeof leaseTenants.$inferSelect;
export type NewLeaseTenant = typeof leaseTenants.$inferInsert;