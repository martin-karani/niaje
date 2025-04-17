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
import { documents } from "./documents";
import { inspections } from "./inspections";
import { maintenanceRequests } from "./maintenance";
import { organization } from "./organization";
import { expenses } from "./payments"; // For property-specific expenses
import { units } from "./units"; // Import units
import { user } from "./users";

// Enums for property types
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

export const properties = pgTable("properties", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id") // Links to the Agent's Organization managing this property
    .notNull()
    .references(() => organization.id, { onDelete: "restrict" }), // Don't delete org if properties exist
  ownerId: text("owner_id") // Links to the actual Landlord/Owner User
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }), // Don't delete user if they own properties
  caretakerId: text("caretaker_id") // Links to the assigned Caretaker User (optional)
    .references(() => user.id, { onDelete: "set null" }), // Allow caretaker deletion

  name: text("name").notNull(), // e.g., "Sunrise Apartments", "123 Main St Lot"
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state"), // Or County/Region
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  latitude: numeric("latitude"), // For map view
  longitude: numeric("longitude"),

  type: propertyTypeEnum("type").notNull(),
  status: propertyStatusEnum("status").default("active").notNull(),
  description: text("description"),
  yearBuilt: integer("year_built"),
  numberOfUnits: integer("number_of_units").default(0), // Could be calculated or stored

  images: json("images"), // Array of image URLs or identifiers
  amenities: json("amenities"), // Array of strings like 'pool', 'gym'
  notes: text("notes"), // Internal notes for the agent org

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for properties table
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  managingOrganization: one(organization, {
    fields: [properties.organizationId],
    references: [organization.id],
  }),
  propertyOwner: one(user, {
    fields: [properties.ownerId],
    references: [user.id],
    relationName: "propertyOwner",
  }),
  propertyCaretaker: one(user, {
    fields: [properties.caretakerId],
    references: [user.id],
    relationName: "propertyCaretaker",
  }),
  units: many(units), // One property has many units
  maintenanceRequests: many(maintenanceRequests), // Requests related to this property
  inspections: many(inspections), // Inspections for this property
  documents: many(documents, { relationName: "propertyDocuments" }), // Property-specific documents
  expenses: many(expenses, { relationName: "propertyExpenses" }), // Expenses for this property
}));

// Types
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
