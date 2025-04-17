import { leaseEntity } from "@/domains/leases/entities/lease.entity";
import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { propertyEntity } from "@/domains/properties/entities/property.entity";
import { unitEntity } from "@/domains/properties/entities/unit.entity";
import { tenantEntity } from "@/domains/tenants/entities/tenant.entity";
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

export const utilityBillStatusEnum = pgEnum("utility_bill_status", [
  "due",
  "paid",
  "overdue",
  "canceled",
]);

export const utilityTypeEnum = pgEnum("utility_type", [
  "water",
  "electricity",
  "gas",
  "internet",
  "trash",
  "sewer",
  "other",
]);

export const utilityBillEntity = pgTable("utility_bills", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => propertyEntity.id, { onDelete: "cascade" }),
  unitId: text("unit_id")
    .notNull()
    .references(() => unitEntity.id, { onDelete: "cascade" }),
  leaseId: text("lease_id").references(() => leaseEntity.id, {
    onDelete: "set null",
  }),
  tenantId: text("tenant_id").references(() => tenantEntity.id, {
    onDelete: "set null",
  }),

  utilityType: utilityTypeEnum("utility_type").notNull(),
  billingPeriodStart: date("billing_period_start").notNull(),
  billingPeriodEnd: date("billing_period_end").notNull(),
  dueDate: date("due_date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: utilityBillStatusEnum("status").default("due").notNull(),

  meterReadingStart: numeric("meter_reading_start"),
  meterReadingEnd: numeric("meter_reading_end"),
  consumption: numeric("consumption"),
  rate: numeric("rate"),

  paymentId: text("payment_id").references(() => paymentEntity.id),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations for utility bills
export const utilityBillsRelations = relations(
  utilityBillEntity,
  ({ one }) => ({
    organization: one(organizationEntity, {
      fields: [utilityBillEntity.organizationId],
      references: [organizationEntity.id],
    }),
    property: one(propertyEntity, {
      fields: [utilityBillEntity.propertyId],
      references: [propertyEntity.id],
    }),
    unit: one(unitEntity, {
      fields: [utilityBillEntity.unitId],
      references: [unitEntity.id],
    }),
    lease: one(leaseEntity, {
      fields: [utilityBillEntity.leaseId],
      references: [leaseEntity.id],
    }),
    tenant: one(tenantEntity, {
      fields: [utilityBillEntity.tenantId],
      references: [tenantEntity.id],
    }),
    payment: one(paymentEntity, {
      fields: [utilityBillEntity.paymentId],
      references: [paymentEntity.id],
    }),
  })
);

// Types
export type UtilityBill = typeof utilityBillEntity.$inferSelect;
export type NewUtilityBill = typeof utilityBillEntity.$inferInsert;
