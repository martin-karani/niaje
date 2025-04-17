import { paymentEntity } from "@domains/billing/entities/payment.entity"; // Adjusted path
import { communicationEntity } from "@domains/communications/entities/communication.entity"; // Adjusted path (assuming comms domain exists)
import { documentEntity } from "@domains/documents/entities/document.entity"; // Adjusted path (assuming documents domain exists)
import { organizationEntity } from "@domains/organizations/entities/organization.entity"; // Adjusted path
import { userEntity } from "@domains/users/entities/user.entity"; // Adjusted path
import { createId } from "@infrastructure/database/utils/id-generator"; // Adjusted path
import { relations } from "drizzle-orm";
import {
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { leaseTenantsEntity } from "./lease-tenant.entity"; // Join table

// Enums for tenant status
export const tenantStatusEnum = pgEnum("tenant_status", [
  "prospect",
  "active",
  "past",
  "rejected",
  "blacklisted",
]); // [cite: 318]

export const tenantEntity = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(createId), // [cite: 319]
  organizationId: text("organization_id") // [cite: 319]
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }), // [cite: 319]
  userId: text("user_id").references(() => userEntity.id, {
    onDelete: "set null",
  }), // [cite: 319]

  firstName: text("first_name").notNull(), // [cite: 319]
  lastName: text("last_name").notNull(), // [cite: 319]
  email: text("email").notNull(), // [cite: 319]
  phone: text("phone"), // [cite: 319]
  status: tenantStatusEnum("status").default("active").notNull(), // [cite: 319]

  dateOfBirth: date("date_of_birth"), // [cite: 319]
  occupation: text("occupation"), // [cite: 320]
  employer: text("employer"), // [cite: 320]
  income: numeric("income"), // [cite: 320]

  // Emergency Contact
  emergencyContactName: text("emergency_contact_name"), // [cite: 320]
  emergencyContactRelation: text("emergency_contact_relation"), // [cite: 320]
  emergencyContactPhone: text("emergency_contact_phone"), // [cite: 320]
  emergencyContactEmail: text("emergency_contact_email"), // [cite: 320]

  // Move-in / Move-out
  expectedMoveInDate: date("expected_move_in_date"), // [cite: 320]
  actualMoveInDate: date("actual_move_in_date"), // [cite: 320]
  expectedMoveOutDate: date("expected_move_out_date"), // [cite: 320]
  actualMoveOutDate: date("actual_move_out_date"), // [cite: 320]

  notes: text("notes"), // [cite: 320]
  createdAt: timestamp("created_at", { withTimezone: true }) // [cite: 320]
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }) // [cite: 320]
    .defaultNow()
    .notNull(),
});

// Define relations for tenants
export const tenantsRelations = relations(tenantEntity, ({ one, many }) => ({
  organization: one(organizationEntity, {
    // [cite: 322]
    fields: [tenantEntity.organizationId],
    references: [organizationEntity.id],
  }),
  userAccount: one(userEntity, {
    // [cite: 322]
    fields: [tenantEntity.userId],
    references: [userEntity.id],
  }),
  leaseAssignments: many(leaseTenantsEntity), // [cite: 322]
  payments: many(paymentEntity), // [cite: 322]
  documents: many(documentEntity, { relationName: "tenantDocuments" }), // [cite: 322]
  communications: many(communicationEntity, {
    // [cite: 322]
    relationName: "tenantCommunications",
  }),
}));

// Types
export type Tenant = typeof tenantEntity.$inferSelect; // [cite: 324]
export type NewTenant = typeof tenantEntity.$inferInsert; // [cite: 324]
