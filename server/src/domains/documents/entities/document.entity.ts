import { inspectionEntity } from "@/domains/inspections/entities";
import { leaseEntity } from "@/domains/leases/entities/lease.entity";
import { organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { propertyEntity } from "@/domains/properties/entities/property.entity";
import { unitEntity } from "@/domains/properties/entities/unit.entity";
import { tenantEntity } from "@/domains/tenants/entities/tenant.entity";
import { userEntity } from "@/domains/users/entities/user.entity";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Document type enum
export const documentTypeEnum = pgEnum("document_type", [
  "lease_agreement",
  "tenant_id",
  "property_photo",
  "unit_photo",
  "inspection_report",
  "maintenance_invoice",
  "rental_application",
  "notice_to_vacate",
  "eviction_notice",
  "receipt",
  "contract",
  "other",
]);

// Storage provider enum
export const storageProviderEnum = pgEnum("storage_provider", [
  "local",
  "s3",
  "azure",
]);

// Document entity
export const documentEntity = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationEntity.id, { onDelete: "cascade" }),

  fileName: text("file_name").notNull(),
  fileType: documentTypeEnum("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),

  storageProvider: storageProviderEnum("storage_provider")
    .default("local")
    .notNull(),
  storagePath: text("storage_path").notNull(),
  url: text("url").notNull(),

  description: text("description"),

  uploadedBy: text("uploaded_by").references(() => userEntity.id, {
    onDelete: "set null",
  }),

  // Related entities - a document can be linked to various entities
  relatedPropertyId: text("related_property_id").references(
    () => propertyEntity.id,
    { onDelete: "set null" }
  ),
  relatedUnitId: text("related_unit_id").references(() => unitEntity.id, {
    onDelete: "set null",
  }),
  relatedLeaseId: text("related_lease_id").references(() => leaseEntity.id, {
    onDelete: "set null",
  }),
  relatedTenantId: text("related_tenant_id").references(() => tenantEntity.id, {
    onDelete: "set null",
  }),
  relatedInspectionId: text("related_inspection_id").references(
    () => inspectionEntity.id,
    {
      onDelete: "set null",
    }
  ),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for documents
export const documentsRelations = relations(documentEntity, ({ one }) => ({
  organization: one(organizationEntity, {
    fields: [documentEntity.organizationId],
    references: [organizationEntity.id],
  }),
  uploader: one(userEntity, {
    fields: [documentEntity.uploadedBy],
    references: [userEntity.id],
  }),
  property: one(propertyEntity, {
    fields: [documentEntity.relatedPropertyId],
    references: [propertyEntity.id],
  }),
  unit: one(unitEntity, {
    fields: [documentEntity.relatedUnitId],
    references: [unitEntity.id],
  }),
  lease: one(leaseEntity, {
    fields: [documentEntity.relatedLeaseId],
    references: [leaseEntity.id],
    relationName: "leaseDocuments",
  }),
  tenant: one(tenantEntity, {
    fields: [documentEntity.relatedTenantId],
    references: [tenantEntity.id],
    relationName: "tenantDocuments",
  }),
  // Add this relation
  inspection: one(inspectionEntity, {
    fields: [documentEntity.relatedInspectionId],
    references: [inspectionEntity.id],
    relationName: "inspectionDocuments",
  }),
}));

// Types
export type Document = typeof documentEntity.$inferSelect;
export type NewDocument = typeof documentEntity.$inferInsert;
