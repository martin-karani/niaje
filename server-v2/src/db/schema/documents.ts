import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { inspections } from "./inspections";
import { leases } from "./leases";
import { organization } from "./organization";
import { properties } from "./properties";
import { tenants } from "./tenants";
import { units } from "./units";
import { user } from "./users"; // User who uploaded

export const documentTypeEnum = pgEnum("document_type", [
  "lease_agreement",
  "tenant_id",
  "inspection_report",
  "property_photo",
  "unit_photo",
  "maintenance_invoice",
  "notice",
  "other",
]);
export const documentStorageProviderEnum = pgEnum("document_storage_provider", [
  "local",
  "s3",
  "google_cloud_storage",
  "azure_blob",
]);

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(createId),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }), // Cascade delete docs if org deleted

  // Links to related entities (make these optional - a doc might relate to one or more)
  relatedPropertyId: text("related_property_id").references(
    () => properties.id,
    { onDelete: "cascade" }
  ),
  relatedUnitId: text("related_unit_id").references(() => units.id, {
    onDelete: "cascade",
  }),
  relatedLeaseId: text("related_lease_id").references(() => leases.id, {
    onDelete: "cascade",
  }),
  relatedTenantId: text("related_tenant_id").references(() => tenants.id, {
    onDelete: "cascade",
  }),
  relatedInspectionId: text("related_inspection_id").references(
    () => inspections.id,
    { onDelete: "cascade" }
  ),
  // Add other relations as needed (e.g., relatedExpenseId)

  fileName: text("file_name").notNull(), // Original file name
  fileType: documentTypeEnum("file_type").default("other"), // Categorization
  mimeType: text("mime_type"), // e.g., 'application/pdf', 'image/jpeg'
  fileSize: integer("file_size"), // Size in bytes

  storageProvider: documentStorageProviderEnum("storage_provider")
    .default("local")
    .notNull(),
  storagePath: text("storage_path").notNull(), // Path or key in the storage provider
  url: text("url"), // Public or pre-signed URL if applicable

  description: text("description"), // Optional description of the document
  uploadedBy: text("uploaded_by").references(() => user.id, {
    onDelete: "set null",
  }), // User who uploaded

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for documents
export const documentsRelations = relations(documents, ({ one }) => ({
  organization: one(organization, {
    fields: [documents.organizationId],
    references: [organization.id],
    relationName: "organizationDocuments",
  }),
  property: one(properties, {
    fields: [documents.relatedPropertyId],
    references: [properties.id],
    relationName: "propertyDocuments",
  }),
  unit: one(units, {
    fields: [documents.relatedUnitId],
    references: [units.id],
  }),
  lease: one(leases, {
    fields: [documents.relatedLeaseId],
    references: [leases.id],
    relationName: "leaseDocuments",
  }),
  tenant: one(tenants, {
    fields: [documents.relatedTenantId],
    references: [tenants.id],
    relationName: "tenantDocuments",
  }),
  inspection: one(inspections, {
    fields: [documents.relatedInspectionId],
    references: [inspections.id],
    relationName: "inspectionDocuments",
  }),
  uploader: one(user, {
    fields: [documents.uploadedBy],
    references: [user.id],
    relationName: "uploader",
  }),
}));

// Types
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
