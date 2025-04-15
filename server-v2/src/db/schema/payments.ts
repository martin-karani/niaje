// src/db/schema/payments.ts
import { relations } from "drizzle-orm";
import {
    date,
    json,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { leases } from "./leases";
import { organization } from "./organization";
import { properties } from "./properties";
import { tenants } from "./tenants";
import { units } from "./units";
import { user } from "./users"; // For who recorded payment/expense

// Enums
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'mpesa', 'credit_card', 'debit_card', 'cheque', 'online_portal', 'other']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'successful', 'failed', 'refunded', 'partially_refunded', 'disputed']);
export const paymentTypeEnum = pgEnum('payment_type', ['rent', 'deposit', 'late_fee', 'utility', 'maintenance', 'management_fee', 'other_income', 'owner_payout', 'expense_reimbursement']);
export const expenseCategoryEnum = pgEnum('expense_category', ['maintenance_repair', 'utilities', 'property_tax', 'insurance', 'management_fee', 'advertising', 'supplies', 'capital_improvement', 'other']);
export const utilityTypeEnum = pgEnum('utility_type', ['water', 'electricity', 'gas', 'internet', 'trash', 'sewer', 'other']);

// Main Payments/Transactions Table
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: 'restrict' }),
  propertyId: text("property_id").references(() => properties.id, { onDelete: 'set null' }), // Optional link
  unitId: text("unit_id").references(() => units.id, { onDelete: 'set null' }), // Optional link
  leaseId: text("lease_id").references(() => leases.id, { onDelete: 'set null' }), // Link to lease if applicable
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: 'set null' }), // Link to tenant if applicable

  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").default('pending').notNull(),
  method: paymentMethodEnum("method"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // e.g., 'KES'
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull(), // When the transaction actually happened
  dueDate: date("due_date"), // For expected payments like rent
  paidDate: timestamp("paid_date", { withTimezone: true }), // When it was marked/confirmed as paid

  description: text("description"),
  notes: text("notes"), // Internal notes
  referenceId: text("reference_id"), // e.g., Mpesa Tx ID, Cheque No, Stripe Charge ID
  processorResponse: json("processor_response"), // Store raw response from payment gateway if applicable

  recordedBy: text("recorded_by").references(() => user.id), // User who recorded the payment
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Utility Bills Table
export const utilityBills = pgTable("utility_bills", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: 'restrict' }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  leaseId: text("lease_id") // Link to lease active during the billing period
      .references(() => leases.id, { onDelete: 'set null' }),
  tenantId: text("tenant_id") // Link to tenant billed
      .references(() => tenants.id, { onDelete: 'set null' }),

  utilityType: utilityTypeEnum("utility_type").notNull(),
  billingPeriodStart: date("billing_period_start").notNull(),
  billingPeriodEnd: date("billing_period_end").notNull(),
  dueDate: date("due_date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: pgEnum('utility_bill_status', ['due', 'paid', 'overdue', 'canceled'])("status").default('due').notNull(),

  meterReadingStart: numeric("meter_reading_start"),
  meterReadingEnd: numeric("meter_reading_end"),
  consumption: numeric("consumption"), // Calculated or entered
  rate: numeric("rate"), // Rate per unit of consumption

  paymentId: text("payment_id").references(() => payments.id), // Link to the payment transaction if paid

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


// Expenses Table
export const expenses = pgTable("expenses", {
   id: text("id").primaryKey().$defaultFn(createId),
   organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: 'restrict' }),
   propertyId: text("property_id").references(() => properties.id, { onDelete: 'set null' }), // Optional link to specific property
   unitId: text("unit_id").references(() => units.id, { onDelete: 'set null' }), // Optional link to specific unit

   category: expenseCategoryEnum("category").notNull(),
   amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
   expenseDate: date("expense_date").notNull(),
   description: text("description").notNull(),
   vendor: text("vendor"), // Who was paid?

   paymentId: text("payment_id").references(() => payments.id), // Link to the corresponding outgoing payment transaction

   recordedBy: text("recorded_by").references(() => user.id), // User who recorded the expense
   notes: text("notes"),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
   updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


// Relations for Payments
export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organization, { fields: [payments.organizationId], references: [organization.id] }),
  property: one(properties, { fields: [payments.propertyId], references: [properties.id] }),
  unit: one(units, { fields: [payments.unitId], references: [units.id] }),
  lease: one(leases, { fields: [payments.leaseId], references: [leases.id] }),
  tenant: one(tenants, { fields: [payments.tenantId], references: [tenants.id] }),
  recorder: one(user, { fields: [payments.recordedBy], references: [user.id] }),
  utilityBill: one(utilityBills, { // If this payment is for a utility bill
       fields: [payments.id],
       references: [utilityBills.paymentId],
  }),
   expense: one(expenses, { // If this payment is for an expense
       fields: [payments.id],
       references: [expenses.paymentId],
   }),
}));

// Relations for Utility Bills
export const utilityBillsRelations = relations(utilityBills, ({ one }) => ({
  organization: one(organization, { fields: [utilityBills.organizationId], references: [organization.id] }),
  property: one(properties, { fields: [utilityBills.propertyId], references: [properties.id] }),
  unit: one(units, { fields: [utilityBills.unitId], references: [units.id] }),
  lease: one(leases, { fields: [utilityBills.leaseId], references: [leases.id] }),
  tenant: one(tenants, { fields: [utilityBills.tenantId], references: [tenants.id] }),
  payment: one(payments, { // Link back to the payment made for this bill
      fields: [utilityBills.paymentId],
      references: [payments.id],
  }),
}));

// Relations for Expenses
export const expensesRelations = relations(expenses, ({ one }) => ({
  organization: one(organization, { fields: [expenses.organizationId], references: [organization.id], relationName: "organizationExpenses" }),
  property: one(properties, { fields: [expenses.propertyId], references: [properties.id], relationName: "propertyExpenses" }),
  unit: one(units, { fields: [expenses.unitId], references: [units.id] }),
  recorder: one(user, { fields: [expenses.recordedBy], references: [user.id] }),
  payment: one(payments, { // Link back to the actual payment transaction
      fields: [expenses.paymentId],
      references: [payments.id],
  }),
}));


// Types
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type UtilityBill = typeof utilityBills.$inferSelect;
export type NewUtilityBill = typeof utilityBills.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;