import { leaseEntity } from "@/domains/leases/entities/lease.entity";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { tenantEntity } from "./tenant.entity";

// Intermediate table for Many-to-Many between Leases and Tenants
export const leaseTenantsEntity = pgTable("lease_tenants", {
  id: text("id").primaryKey().$defaultFn(createId),
  leaseId: text("lease_id")
    .notNull()
    .references(() => leaseEntity.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantEntity.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Define relations for the join table LeaseTenants
export const leaseTenantsRelations = relations(
  leaseTenantsEntity,
  ({ one }) => ({
    lease: one(leaseEntity, {
      fields: [leaseTenantsEntity.leaseId],
      references: [leaseEntity.id],
    }),
    tenant: one(tenantEntity, {
      fields: [leaseTenantsEntity.tenantId],
      references: [tenantEntity.id],
    }),
  })
);

// Types
export type LeaseTenant = typeof leaseTenantsEntity.$inferSelect;
export type NewLeaseTenant = typeof leaseTenantsEntity.$inferInsert;
