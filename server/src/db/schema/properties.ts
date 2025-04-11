import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { tenants, users } from "./users";

// Define properties table
export const properties = pgTable("properties", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  caretakerId: text("caretaker_id").references(() => users.id),
  agentId: text("agent_id").references(() => users.id),
});

export const units = pgTable("units", {
  id: text("id").primaryKey().$defaultFn(createId),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Unit identifier like "101", "A", etc.
  type: text("type").notNull(), // Studio, 1BR, 2BR, etc.
  bedrooms: integer("bedrooms").default(1),
  bathrooms: numeric("bathrooms").default("1"),
  size: numeric("size"),
  rent: numeric("rent").notNull(),
  depositAmount: numeric("deposit_amount"),
  status: text("status").default("vacant").notNull(), // vacant, occupied, maintenance
  features: json("features"),
  images: json("images"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leases = pgTable("leases", {
  id: text("id").primaryKey().$defaultFn(createId),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  rentAmount: numeric("rent_amount").notNull(),
  depositAmount: numeric("deposit_amount").notNull(),
  status: text("status").default("active").notNull(), // active, expired, terminated
  paymentDay: integer("payment_day").default(1), // Day of month rent is due
  paymentFrequency: text("payment_frequency").default("monthly"), // monthly, weekly, etc.

  // Utility billing settings
  includesWater: boolean("includes_water").default(false),
  includesElectricity: boolean("includes_electricity").default(false),
  includesGas: boolean("includes_gas").default(false),
  includesInternet: boolean("includes_internet").default(false),
  waterBillingType: text("water_billing_type").default("tenant_pays"), // landlord_pays, tenant_pays, split, fixed_amount
  electricityBillingType: text("electricity_billing_type").default(
    "tenant_pays"
  ),
  gasBillingType: text("gas_billing_type").default("tenant_pays"),
  internetBillingType: text("internet_billing_type").default("tenant_pays"),
  waterFixedAmount: numeric("water_fixed_amount"), // Only used if billing type is fixed_amount
  electricityFixedAmount: numeric("electricity_fixed_amount"),
  gasFixedAmount: numeric("gas_fixed_amount"),
  internetFixedAmount: numeric("internet_fixed_amount"),

  createdBy: text("created_by").references(() => users.id), // User who created lease
  documentUrl: text("document_url"), // URL to lease document
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const propertyUnits = pgTable("property_units", {
  id: text("id").primaryKey().$defaultFn(createId),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  unitId: text("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for properties table
export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
    relationName: "propertyOwner",
  }),
  caretaker: one(users, {
    fields: [properties.caretakerId],
    references: [users.id],
    relationName: "propertyCaretaker",
  }),
  agent: one(users, {
    fields: [properties.agentId],
    references: [users.id],
    relationName: "propertyAgent",
  }),
}));

// Types
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;
export type Lease = typeof leases.$inferSelect;
export type NewLease = typeof leases.$inferInsert;
export type PropertyUnit = typeof propertyUnits.$inferSelect;
export type NewPropertyUnit = typeof propertyUnits.$inferInsert;
