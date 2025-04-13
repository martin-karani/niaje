import { relations } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { leases } from "./properties";
import { users } from "./users";

export const utilityBills = pgTable("utility_bills", {
  id: text("id").primaryKey().$defaultFn(createId),
  leaseId: text("lease_id")
    .notNull()
    .references(() => leases.id),
  utilityType: text("utility_type").notNull(), // water, electricity, gas, internet
  billDate: timestamp("bill_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: numeric("amount").notNull(),
  tenantResponsibilityPercent: numeric("tenant_responsibility_percent").default(
    "100"
  ),
  tenantAmount: numeric("tenant_amount").notNull(),
  landlordAmount: numeric("landlord_amount").default("0"),
  isPaid: boolean("is_paid").default(false),
  paidDate: timestamp("paid_date"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(createId),
  leaseId: text("lease_id")
    .notNull()
    .references(() => leases.id),
  utilityBillId: text("utility_bill_id").references(() => utilityBills.id), // Optional reference to a utility bill
  amount: numeric("amount").notNull(),
  type: text("type").notNull(), // rent, deposit, utility, fee, refund
  category: text("category"), // water, electricity, gas, internet, late_fee, etc.
  status: text("status").default("pending").notNull(), // pending, completed, failed
  paymentMethod: text("payment_method"), // cash, bank transfer, card
  paymentDate: timestamp("payment_date").notNull(),
  dueDate: timestamp("due_date"),
  recordedBy: text("recorded_by").references(() => users.id), // Who recorded payment
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const utilityBillsRelations = relations(utilityBills, ({ one }) => ({
  lease: one(leases, {
    fields: [utilityBills.leaseId],
    references: [leases.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  lease: one(leases, {
    fields: [transactions.leaseId],
    references: [leases.id],
  }),
  utilityBill: one(utilityBills, {
    fields: [transactions.utilityBillId],
    references: [utilityBills.id],
  }),
  recorder: one(users, {
    fields: [transactions.recordedBy],
    references: [users.id],
    relationName: "transactionRecorder",
  }),
}));
