import { relations } from "drizzle-orm";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { documents } from "./documents"; // Link to inspection report document
import { leases } from "./leases"; // Link inspection to a lease (move-in/out)
import { organization } from "./organization";
import { properties } from "./properties";
import { units } from "./units";
import { user } from "./users"; // Link to inspector

// Enums
export const inspectionTypeEnum = pgEnum("inspection_type", [
  "move_in",
  "move_out",
  "periodic",
  "drive_by",
  "safety",
  "other",
]);
export const inspectionStatusEnum = pgEnum("inspection_status", [
  "scheduled",
  "completed",
  "canceled",
  "pending_report",
]);

export const inspections = pgTable("inspections", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  unitId: text("unit_id").references(() => units.id, { onDelete: "cascade" }), // Optional, if specific to a unit
  leaseId: text("lease_id").references(() => leases.id, {
    onDelete: "set null",
  }), // Link to lease for move-in/out

  type: inspectionTypeEnum("type").notNull(),
  status: inspectionStatusEnum("status").default("scheduled").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  completedDate: timestamp("completed_date", { withTimezone: true }),

  inspectorId: text("inspector_id").references(() => user.id), // User who performed the inspection
  summary: text("summary"), // Overall summary of findings
  conditionRating: integer("condition_rating"), // e.g., 1-5 scale
  notes: text("notes"), // Detailed notes, room by room etc. stored as text or JSON
  findings: json("findings"), // Structured findings: { area: 'kitchen', item: 'sink', condition: 'good', notes: '', photoUrl: '' }

  tenantSignature: text("tenant_signature"), // Could be URL to image or digital signature data
  inspectorSignature: text("inspector_signature"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for inspections
export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  organization: one(organization, {
    fields: [inspections.organizationId],
    references: [organization.id],
  }),
  property: one(properties, {
    fields: [inspections.propertyId],
    references: [properties.id],
  }),
  unit: one(units, { fields: [inspections.unitId], references: [units.id] }),
  lease: one(leases, {
    fields: [inspections.leaseId],
    references: [leases.id],
  }),
  inspector: one(user, {
    fields: [inspections.inspectorId],
    references: [user.id],
    relationName: "inspector",
  }),
  documents: many(documents, { relationName: "inspectionDocuments" }), // Link to generated report PDF etc.
}));

// Types
export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;
