import { leaseEntity } from "@/domains/leases/entities";
import { organizationEntity } from "@/domains/organizations/entities";
import { propertyEntity, unitEntity } from "@/domains/properties/entities";
import { tenantEntity } from "@/domains/tenants/entities";
import { userEntity } from "@/domains/users/entities";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import {
  date,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { expenseEntity } from "./expense.entity";
import { utilityBillEntity } from "./utility-bill.entity";

// Enums
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "mpesa",
  "credit_card",
  "debit_card",
  "cheque",
  "online_portal",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "successful",
  "failed",
  "refunded",
  "partially_refunded",
  "disputed",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "rent",
  "deposit",
  "late_fee",
  "utility",
  "maintenance",
  "management_fee",
  "other_income",
  "owner_payout",
  "expense_reimbursement",
]);

// Main Payments/Transactions Table
export const paymentEntity = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  propertyId: text("property_id").references(() => propertyEntity.id, {
    onDelete: "set null",
  }), // Optional link
  unitId: text("unit_id").references(() => unitEntity.id, {
    onDelete: "set null",
  }), // Optional link
  leaseId: text("lease_id").references(() => leaseEntity.id, {
    onDelete: "set null",
  }), // Link to lease if applicable
  tenantId: text("tenant_id").references(() => tenantEntity.id, {
    onDelete: "set null",
  }), // Link to tenant if applicable

  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  method: paymentMethodEnum("method"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // e.g., 'KES'
  transactionDate: timestamp("transaction_date", {
    withTimezone: true,
  }).notNull(), // When the transaction actually happened
  dueDate: date("due_date"), // For expected payments like rent
  paidDate: timestamp("paid_date", { withTimezone: true }), // When it was marked/confirmed as paid

  description: text("description"),
  notes: text("notes"), // Internal notes
  referenceId: text("reference_id"), // e.g., Mpesa Tx ID, Cheque No, Stripe Charge ID
  processorResponse: json("processor_response"), // Store raw response from payment gateway if applicable

  recordedBy: text("recorded_by").references(() => userEntity.id), // User who recorded the payment
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations for Payments
export const paymentsRelations = relations(paymentEntity, ({ one }) => ({
  organization: one(organizationEntity, {
    fields: [paymentEntity.organizationId],
    references: [organizationEntity.id],
  }),
  property: one(propertyEntity, {
    fields: [paymentEntity.propertyId],
    references: [propertyEntity.id],
  }),
  unit: one(unitEntity, {
    fields: [paymentEntity.unitId],
    references: [unitEntity.id],
  }),
  lease: one(leaseEntity, {
    fields: [paymentEntity.leaseId],
    references: [leaseEntity.id],
  }),
  tenant: one(tenantEntity, {
    fields: [paymentEntity.tenantId],
    references: [tenantEntity.id],
  }),
  recorder: one(userEntity, {
    fields: [paymentEntity.recordedBy],
    references: [userEntity.id],
  }),
  utilityBill: one(utilityBillEntity, {
    // If this payment is for a utility bill
    fields: [paymentEntity.id],
    references: [utilityBillEntity.paymentId],
  }),
  expense: one(expenseEntity, {
    // If this payment is for an expense
    fields: [paymentEntity.id],
    references: [expenseEntity.paymentId],
  }),
}));

// Types
export type Payment = typeof paymentEntity.$inferSelect;
export type NewPayment = typeof paymentEntity.$inferInsert;
