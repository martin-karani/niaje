import { paymentEntity } from "@/domains/billing/entities/payment.entity";
import { communicationEntity } from "@/domains/communications/entities";
import { documentEntity } from "@/domains/documents/entities/document.entity";
import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { userEntity } from "@/domains/users/entities/user.entity";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { leaseTenantsEntity } from "./lease-tenant.entity";

// Enums for tenant status
export const tenantStatusEnum = pgEnum("tenant_status", [
  "prospect",
  "active",
  "past",
  "rejected",
  "blacklisted",
]);

export const tenantEntity = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  userId: text("user_id").references(() => userEntity.id, {
    onDelete: "set null",
  }),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: tenantStatusEnum("status").default("active").notNull(),

  dateOfBirth: date("date_of_birth"),
  occupation: text("occupation"),
  employer: text("employer"),
  income: numeric("income"),

  // Emergency Contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactRelation: text("emergency_contact_relation"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactEmail: text("emergency_contact_email"),

  // Move-in / Move-out
  expectedMoveInDate: date("expected_move_in_date"),
  actualMoveInDate: date("actual_move_in_date"),
  expectedMoveOutDate: date("expected_move_out_date"),
  actualMoveOutDate: date("actual_move_out_date"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for tenants
export const tenantsRelations = relations(tenantEntity, ({ one, many }) => ({
  organization: one(organizationEntity, {
    fields: [tenantEntity.organizationId],
    references: [organizationEntity.id],
  }),
  userAccount: one(userEntity, {
    fields: [tenantEntity.userId],
    references: [userEntity.id],
  }),
  leaseAssignments: many(leaseTenantsEntity),
  payments: many(paymentEntity),
  documents: many(documentEntity, { relationName: "tenantDocuments" }),
  communications: many(communicationEntity, {
    relationName: "tenantCommunications",
  }),
}));

// Types
export type Tenant = typeof tenantEntity.$inferSelect; // [cite: 324]
export type NewTenant = typeof tenantEntity.$inferInsert; // [cite: 324]
