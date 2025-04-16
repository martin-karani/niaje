import { relations } from "drizzle-orm";
import {
  integer,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { inspections } from "./inspections";
import { leases } from "./leases"; // Import leases
import { maintenanceRequests } from "./maintenance";
import { organization } from "./organization";
import { utilityBills } from "./payments"; // Import utilityBills
import { properties } from "./properties";

// Enums for unit status
export const unitStatusEnum = pgEnum("unit_status", [
  "vacant",
  "occupied",
  "notice_given",
  "under_maintenance",
  "archived",
]);

export const units = pgTable("units", {
  id: text("id").primaryKey().$defaultFn(createId),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }), // Delete units if property deleted
  organizationId: text("organization_id") // Denormalized/derived from property for easier filtering
    .notNull()
    .references(() => organization.id),

  name: text("name").notNull(), // Unit identifier like "Apt 101", "Suite 2B", "Unit 5"
  type: text("type").notNull(),
  status: unitStatusEnum("status").default("vacant").notNull(),
  bedrooms: integer("bedrooms").default(1),
  bathrooms: numeric("bathrooms", { precision: 2, scale: 1 }).default("1.0"), // e.g., 1.5 baths
  sizeSqFt: numeric("size_sq_ft"), // Size in square feet (or use sq meters)
  floor: integer("floor"), // Which floor the unit is on

  marketRent: numeric("market_rent"), // Estimated market rent
  currentRent: numeric("current_rent"), // Actual rent from current lease (can be denormalized)
  depositAmount: numeric("deposit_amount"), // Standard deposit for this unit type

  features: json("features"), // Array of strings: 'balcony', 'hardwood_floors', 'washer_dryer'
  images: json("images"), // Array of image URLs or identifiers
  notes: text("notes"), // Internal notes about the unit

  // Meter readings (optional, if tracking individually)
  waterMeterId: text("water_meter_id"),
  electricityMeterId: text("electricity_meter_id"),
  gasMeterId: text("gas_meter_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for units
export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
  organization: one(organization, {
    // Link back to org for easier queries
    fields: [units.organizationId],
    references: [organization.id],
  }),
  leases: many(leases), // A unit can have multiple (historical) leases
  // activeLease: one(leases, {
  //   // Potentially link to the currently active lease
  //   relationName: "activeLease",
  //   // Need a way to determine 'active' status in the relation query or a dedicated field
  // }),
  maintenanceRequests: many(maintenanceRequests), // Requests specific to this unit
  inspections: many(inspections), // Inspections for this unit
  utilityBills: many(utilityBills), // Utility bills for this unit
}));

// Types
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;
