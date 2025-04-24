import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { teamEntity } from "./organization.entity";

export const resourcePermissionEntity = pgTable(
  "resource_permissions",
  {
    teamId: text("team_id").references(() => teamEntity.id, {
      onDelete: "cascade",
    }),
    resourceType: text("resource_type").notNull(), // e.g., 'property', 'tenant', 'lease'
    resourceId: text("resource_id").notNull(),
    action: text("action").notNull(), // e.g., 'view', 'create', 'update', 'delete'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [
          table.teamId,
          table.resourceType,
          table.resourceId,
          table.action,
        ],
      }),
    };
  }
);
