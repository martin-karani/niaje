import { leaseEntity } from "@domains/leases/entities/lease.entity"; // Adjusted path
import { createId } from "@infrastructure/database/utils/id-generator"; // Adjusted path
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tenantEntity } from "./tenant.entity";

// Intermediate table for Many-to-Many between Leases and Tenants
export const leaseTenantsEntity = pgTable("lease_tenants", {
  id: text("id").primaryKey().$defaultFn(createId), // [cite: 321]
  leaseId: text("lease_id") // [cite: 321]
    .notNull()
    .references(() => leaseEntity.id, { onDelete: "cascade" }), // [cite: 321]
  tenantId: text("tenant_id") // [cite: 321]
    .notNull()
    .references(() => tenantEntity.id, { onDelete: "cascade" }), // [cite: 321]
  isPrimary: boolean("is_primary").default(true).notNull(), // [cite: 321]
  createdAt: timestamp("created_at", { withTimezone: true }) // [cite: 321]
    .defaultNow()
    .notNull(),
});

// Define relations for the join table LeaseTenants
export const leaseTenantsRelations = relations(
  leaseTenantsEntity,
  ({ one }) => ({
    lease: one(leaseEntity, {
      // [cite: 323]
      fields: [leaseTenantsEntity.leaseId],
      references: [leaseEntity.id],
    }),
    tenant: one(tenantEntity, {
      // [cite: 323]
      fields: [leaseTenantsEntity.tenantId],
      references: [tenantEntity.id],
    }),
  })
);

// Types
export type LeaseTenant = typeof leaseTenantsEntity.$inferSelect; // [cite: 324]
export type NewLeaseTenant = typeof leaseTenantsEntity.$inferInsert; // [cite: 325]
