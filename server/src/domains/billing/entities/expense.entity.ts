import { organizationEntity } from "@/domains/organizations/entities";
import { propertyEntity } from "@/domains/properties/entities";
import { unitEntity } from "@/domains/properties/entities/unit.entity";
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
import { paymentEntity } from "./payment.entity";

// Enums
export const expenseCategoryEnum = pgEnum("expense_category", [
  "maintenance_repair",
  "utilities",
  "property_tax",
  "insurance",
  "management_fee",
  "advertising",
  "supplies",
  "capital_improvement",
  "other",
]);

// Expenses Table
export const expenseEntity = pgTable("expenses", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  propertyId: text("property_id").references(() => propertyEntity.id, {
    onDelete: "set null",
  }), // Optional link to specific property
  unitId: text("unit_id").references(() => unitEntity.id, {
    onDelete: "set null",
  }), // Optional link to specific unit

  category: expenseCategoryEnum("category").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  description: text("description").notNull(),
  vendor: text("vendor"), // Who was paid?

  paymentId: text("payment_id").references(() => paymentEntity.id), // Link to the corresponding outgoing payment transaction

  recordedBy: text("recorded_by").references(() => userEntity.id), // User who recorded the expense
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations for Expenses
export const expensesRelations = relations(expenseEntity, ({ one }) => ({
  organization: one(organizationEntity, {
    fields: [expenseEntity.organizationId],
    references: [organizationEntity.id],
    relationName: "organizationExpenses",
  }),
  property: one(propertyEntity, {
    fields: [expenseEntity.propertyId],
    references: [propertyEntity.id],
    relationName: "propertyExpenses",
  }),
  unit: one(unitEntity, {
    fields: [expenseEntity.unitId],
    references: [unitEntity.id],
  }),
  recorder: one(userEntity, {
    fields: [expenseEntity.recordedBy],
    references: [userEntity.id],
  }),
  payment: one(paymentEntity, {
    // Link back to the actual payment transaction
    fields: [expenseEntity.paymentId],
    references: [paymentEntity.id],
  }),
}));

// Types
export type Expense = typeof expenseEntity.$inferSelect;
export type NewExpense = typeof expenseEntity.$inferInsert;
