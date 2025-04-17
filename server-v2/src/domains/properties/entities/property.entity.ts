import { organizationEntity } from "@domains/organizations/entities/organization.entity";
import { userEntity } from "@domains/users/entities/user.entity";
import { createId } from "@infrastructure/database/utils/id-generator";
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

export const propertyTypeEnum = pgEnum("property_type", [
  "residential",
  "commercial",
  "mixed_use",
  "land",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "active",
  "inactive",
  "under_construction",
  "sold",
]);

export const propertyEntity = pgTable("properties", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => userEntity.id, { onDelete: "restrict" }),
  caretakerId: text("caretaker_id").references(() => userEntity.id, {
    onDelete: "set null",
  }),

  name: text("name").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),

  type: propertyTypeEnum("type").notNull(),
  status: propertyStatusEnum("status").default("active").notNull(),
  description: text("description"),
  yearBuilt: integer("year_built"),
  numberOfUnits: integer("number_of_units").default(0),

  images: json("images"),
  amenities: json("amenities"),
  notes: text("notes"),
  metadata: json("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const propertyRelations = relations(propertyEntity, ({ one, many }) => ({
  organization: one(organizationEntity, {
    fields: [propertyEntity.organizationId],
    references: [organizationEntity.id],
  }),
  owner: one(userEntity, {
    fields: [propertyEntity.ownerId],
    references: [userEntity.id],
    relationName: "propertyOwner",
  }),
  caretaker: one(userEntity, {
    fields: [propertyEntity.caretakerId],
    references: [userEntity.id],
    relationName: "propertyCaretaker",
  }),
}));

export type Property = typeof propertyEntity.$inferSelect;
export type NewProperty = typeof propertyEntity.$inferInsert;
