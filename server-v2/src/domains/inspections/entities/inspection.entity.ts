import { documentEntity } from "@domains/documents/entities/document.entity"; // Adjusted path, assuming documents domain
import { leaseEntity } from "@domains/leases/entities/lease.entity"; // Adjusted path
import { organizationEntity } from "@domains/organizations/entities/organization.entity"; // Adjusted path
import { propertyEntity } from "@domains/properties/entities/property.entity"; // Adjusted path
import { unitEntity } from "@domains/properties/entities/unit.entity"; // Adjusted path
import { userEntity } from "@domains/users/entities/user.entity"; // Adjusted path
import { createId } from "@infrastructure/database/utils/id-generator"; // Adjusted path
import { relations } from "drizzle-orm";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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

export const inspectionEntity = pgTable("inspections", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => propertyEntity.id, { onDelete: "cascade" }),
  unitId: text("unit_id").references(() => unitEntity.id, {
    onDelete: "cascade",
  }), // Optional, if specific to a unit
  leaseId: text("lease_id").references(() => leaseEntity.id, {
    onDelete: "set null",
  }), // Link to lease for move-in/out

  type: inspectionTypeEnum("type").notNull(),
  status: inspectionStatusEnum("status").default("scheduled").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  completedDate: timestamp("completed_date", { withTimezone: true }),

  inspectorId: text("inspector_id").references(() => userEntity.id), // User who performed the inspection
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
export const inspectionsRelations = relations(
  inspectionEntity,
  ({ one, many }) => ({
    organization: one(organizationEntity, {
      fields: [inspectionEntity.organizationId],
      references: [organizationEntity.id],
    }),
    property: one(propertyEntity, {
      fields: [inspectionEntity.propertyId],
      references: [propertyEntity.id],
    }),
    unit: one(unitEntity, {
      fields: [inspectionEntity.unitId],
      references: [unitEntity.id],
    }),
    lease: one(leaseEntity, {
      fields: [inspectionEntity.leaseId],
      references: [leaseEntity.id],
    }),
    inspector: one(userEntity, {
      fields: [inspectionEntity.inspectorId],
      references: [userEntity.id],
      relationName: "inspector",
    }),
    documents: many(documentEntity, { relationName: "inspectionDocuments" }), // Link to generated report PDF etc.
  })
);

// Types
export type Inspection = typeof inspectionEntity.$inferSelect;
export type NewInspection = typeof inspectionEntity.$inferInsert;
