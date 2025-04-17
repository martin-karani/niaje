import { paymentEntity, utilityBillEntity } from "@domains/billing/entities";
import { documentEntity } from "@domains/documents/entities/document.entity";
import { organizationEntity } from "@domains/organizations/entities/organization.entity";
import { propertyEntity } from "@domains/properties/entities/property.entity";
import { unitEntity } from "@domains/properties/entities/unit.entity"; // (Units are part of Properties domain)
import { leaseTenantsEntity } from "@domains/tenants/entities/lease-tenant.entity";
import { userEntity } from "@domains/users/entities/user.entity";
import { createId } from "@infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Enums for lease status and billing types
export const leaseStatusEnum = pgEnum("lease_status", [
  "draft",
  "active",
  "expired",
  "terminated",
  "pending_renewal",
  "future",
]);
export const paymentFrequencyEnum = pgEnum("payment_frequency", [
  "monthly",
  "weekly",
  "bi_weekly",
  "quarterly",
  "yearly",
]);
export const utilityBillingTypeEnum = pgEnum("utility_billing_type", [
  "tenant_pays_provider",
  "tenant_pays_landlord_metered",
  "tenant_pays_landlord_fixed",
  "landlord_pays",
  "included_in_rent",
]);
export const lateFeeTypeEnum = pgEnum("late_fee_type", [
  "fixed",
  "percentage",
  "no_fee",
]);

export const leaseEntity = pgTable("leases", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  unitId: text("unit_id")
    .notNull()
    .references(() => unitEntity.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => propertyEntity.id, { onDelete: "cascade" }), // Cascade if property deleted

  status: leaseStatusEnum("status").default("draft").notNull(), //
  startDate: date("start_date").notNull(), //
  endDate: date("end_date").notNull(), //
  moveInDate: date("move_in_date"), //
  moveOutDate: date("move_out_date"), //

  rentAmount: numeric("rent_amount", { precision: 10, scale: 2 }).notNull(), //
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).default(
    //
    "0.00"
  ),
  paymentDay: integer("payment_day").default(1).notNull(), //
  paymentFrequency: paymentFrequencyEnum("payment_frequency") //
    .default("monthly")
    .notNull(),
  gracePeriodDays: integer("grace_period_days").default(0), //
  lateFeeType: lateFeeTypeEnum("late_fee_type").default("no_fee"), //
  lateFeeAmount: numeric("late_fee_amount", { precision: 10, scale: 2 }), //
  lateFeeMaxAmount: numeric("late_fee_max_amount", { precision: 10, scale: 2 }), //

  // Utility billing settings
  waterBillingType: utilityBillingTypeEnum("water_billing_type").default(
    //
    "tenant_pays_provider"
  ),
  electricityBillingType: utilityBillingTypeEnum(
    //
    "electricity_billing_type"
  ).default("tenant_pays_provider"),
  gasBillingType: utilityBillingTypeEnum("gas_billing_type").default(
    //
    "tenant_pays_provider"
  ),
  internetBillingType: utilityBillingTypeEnum("internet_billing_type").default(
    //
    "tenant_pays_provider"
  ),
  //
  trashBillingType:
    utilityBillingTypeEnum("trash_billing_type").default("included_in_rent"),
  waterFixedAmount: numeric("water_fixed_amount", { precision: 10, scale: 2 }), //
  electricityFixedAmount: numeric("electricity_fixed_amount", {
    //
    precision: 10,
    scale: 2,
  }),
  gasFixedAmount: numeric("gas_fixed_amount", { precision: 10, scale: 2 }), //
  internetFixedAmount: numeric("internet_fixed_amount", {
    //
    precision: 10,
    scale: 2,
  }),
  trashFixedAmount: numeric("trash_fixed_amount", { precision: 10, scale: 2 }), //

  // Other Terms
  petsAllowed: boolean("pets_allowed").default(false), //
  petPolicyNotes: text("pet_policy_notes"), //
  smokingAllowed: boolean("smoking_allowed").default(false), //
  leaseTerminationTerms: text("lease_termination_terms"), //

  createdBy: text("created_by").references(() => userEntity.id, {
    onDelete: "set null",
  }), // Set null if creator user deleted
  notes: text("notes"), //
  createdAt: timestamp("created_at", { withTimezone: true }) //
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }) //
    .defaultNow()
    .notNull(),
});

// Define relations for leases
export const leasesRelations = relations(leaseEntity, ({ one, many }) => ({
  //
  organization: one(organizationEntity, {
    //
    fields: [leaseEntity.organizationId],
    references: [organizationEntity.id],
  }),
  unit: one(unitEntity, {
    //
    fields: [leaseEntity.unitId],
    references: [unitEntity.id],
  }),
  property: one(propertyEntity, {
    //
    fields: [leaseEntity.propertyId],
    references: [propertyEntity.id],
  }),
  creator: one(userEntity, {
    fields: [leaseEntity.createdBy],
    references: [userEntity.id],
    relationName: "leaseCreator",
  }),
  tenantAssignments: many(leaseTenantsEntity),
  payments: many(paymentEntity),
  utilityBills: many(utilityBillEntity),
  documents: many(documentEntity, { relationName: "leaseDocuments" }),
}));

// Types
export type Lease = typeof leaseEntity.$inferSelect;
export type NewLease = typeof leaseEntity.$inferInsert;
