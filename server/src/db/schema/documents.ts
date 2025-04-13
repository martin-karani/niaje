import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { users } from "./users";

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  type: text("type").notNull(), // lease, payment_receipt, maintenance
  url: text("url").notNull(),
  relatedId: text("related_id"), // ID of related entity
  relatedType: text("related_type"), // Type of related entity
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
    relationName: "documentUploader",
  }),
}));

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
