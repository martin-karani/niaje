import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { createId } from "@/infrastructure/database/utils/id-generator";
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
import { propertyEntity } from "./property.entity";

export const unitTypeEnum = pgEnum("unit_type", [
  "studio",
  "one_br",
  "two_br",
  "three_br",
  "four_br_plus",
  "penthouse",
  "commercial_office",
  "commercial_retail",
  "commercial_warehouse",
  "other",
]);

export const unitStatusEnum = pgEnum("unit_status", [
  "vacant",
  "occupied",
  "notice_given",
  "under_maintenance",
  "archived",
]);

export const unitEntity = pgTable("units", {
  id: text("id").primaryKey().$defaultFn(createId),
  propertyId: text("property_id")
    .notNull()
    .references(() => propertyEntity.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id),

  name: text("name").notNull(),
  type: unitTypeEnum("type").notNull(),
  status: unitStatusEnum("status").default("vacant").notNull(),
  bedrooms: integer("bedrooms").default(1),
  bathrooms: numeric("bathrooms", { precision: 2, scale: 1 }).default("1.0"),
  sizeSqFt: numeric("size_sq_ft"),
  floor: integer("floor"),

  marketRent: numeric("market_rent"),
  currentRent: numeric("current_rent"),
  depositAmount: numeric("deposit_amount"),

  features: json("features"),
  images: json("images"),
  notes: text("notes"),

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

export const unitRelations = relations(unitEntity, ({ one, many }) => ({
  property: one(propertyEntity, {
    fields: [unitEntity.propertyId],
    references: [propertyEntity.id],
  }),
  organization: one(organizationEntity, {
    fields: [unitEntity.organizationId],
    references: [organizationEntity.id],
  }),
}));

export type Unit = typeof unitEntity.$inferSelect;
export type NewUnit = typeof unitEntity.$inferInsert;
