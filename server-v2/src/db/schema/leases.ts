// src/db/schema/leases.ts
import { relations } from "drizzle-orm";
import {
    boolean,
    date,
    integer,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { documents } from "./documents"; // For lease documents
import { organization } from "./organization";
import { payments, utilityBills } from "./payments"; // Import payments
import { leaseTenants } from "./tenants"; // Import tenants and join table
import { units } from "./units";
import { user } from "./users";

// Enums for lease status and billing types
export const leaseStatusEnum = pgEnum('lease_status', ['draft', 'active', 'expired', 'terminated', 'pending_renewal', 'future']);
export const paymentFrequencyEnum = pgEnum('payment_frequency', ['monthly', 'weekly', 'bi_weekly', 'quarterly', 'yearly']);
export const utilityBillingTypeEnum = pgEnum('utility_billing_type', ['tenant_pays_provider', 'tenant_pays_landlord_metered', 'tenant_pays_landlord_fixed', 'landlord_pays', 'included_in_rent']);

export const leases = pgTable("leases", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: 'restrict' }),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "restrict" }), // Don't delete unit if active lease exists? Or cascade?
  propertyId: text("property_id") // Denormalized/derived from unit for easier filtering
      .notNull()
      .references(() => units.propertyId),

  status: leaseStatusEnum("status").default("draft").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  moveInDate: date("move_in_date"),
  moveOutDate: date("move_out_date"), // Actual move out

  rentAmount: numeric("rent_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).default("0.00"),
  paymentDay: integer("payment_day").default(1).notNull(), // Day of month rent is due (1-31)
  paymentFrequency: paymentFrequencyEnum("payment_frequency").default("monthly").notNull(),
  gracePeriodDays: integer("grace_period_days").default(0), // Days after due date before late fees apply
  lateFeeType: pgEnum('late_fee_type', ['fixed', 'percentage', 'none'])("late_fee_type").default('none'),
  lateFeeAmount: numeric("late_fee_amount", { precision: 10, scale: 2 }), // Fixed amount or percentage rate
  lateFeeMaxAmount: numeric("late_fee_max_amount", { precision: 10, scale: 2 }), // Cap for percentage fees

  // Utility billing settings
  waterBillingType: utilityBillingTypeEnum("water_billing_type").default("tenant_pays_provider"),
  electricityBillingType: utilityBillingTypeEnum("electricity_billing_type").default("tenant_pays_provider"),
  gasBillingType: utilityBillingTypeEnum("gas_billing_type").default("tenant_pays_provider"),
  internetBillingType: utilityBillingTypeEnum("internet_billing_type").default("tenant_pays_provider"),
  trashBillingType: utilityBillingTypeEnum("trash_billing_type").default("included_in_rent"),
  // Fixed amounts if using tenant_pays_landlord_fixed
  waterFixedAmount: numeric("water_fixed_amount", { precision: 10, scale: 2 }),
  electricityFixedAmount: numeric("electricity_fixed_amount", { precision: 10, scale: 2 }),
  gasFixedAmount: numeric("gas_fixed_amount", { precision: 10, scale: 2 }),
  internetFixedAmount: numeric("internet_fixed_amount", { precision: 10, scale: 2 }),
  trashFixedAmount: numeric("trash_fixed_amount", { precision: 10, scale: 2 }),

  // Other Terms
  petsAllowed: boolean("pets_allowed").default(false),
  petPolicyNotes: text("pet_policy_notes"),
  smokingAllowed: boolean("smoking_allowed").default(false),
  leaseTerminationTerms: text("lease_termination_terms"),

  createdBy: text("created_by").references(() => user.id), // User (agent staff) who created lease
  notes: text("notes"), // Internal lease notes
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Define relations for leases
export const leasesRelations = relations(leases, ({ one, many }) => ({
  organization: one(organization, {
    fields: [leases.organizationId],
    references: [organization.id],
  }),
  unit: one(units, {
    fields: [leases.unitId],
    references: [units.id],
  }),
  property: one(properties, { // Link back to property for easier queries
      fields: [leases.propertyId],
      references: [properties.id],
  }),
  creator: one(user, { // User (agent staff) who created the lease
    fields: [leases.createdBy],
    references: [user.id],
    relationName: "leaseCreator",
  }),
  tenantAssignments: many(leaseTenants), // Link to tenants via the join table
  payments: many(payments), // Payments made against this lease (rent, deposit, fees)
  utilityBills: many(utilityBills), // Utility bills generated for this lease period
  documents: many(documents, { relationName: "leaseDocuments" }), // Lease agreement documents etc.
}));

// Types
export type Lease = typeof leases.$inferSelect;
export type NewLease = typeof leases.$inferInsert;