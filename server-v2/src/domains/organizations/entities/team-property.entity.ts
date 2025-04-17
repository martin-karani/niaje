import { propertyEntity } from "@/domains/properties/entities/property.entity";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teamEntity } from "./organization.entity";

// Team-Property join table for managing which properties are assigned to which teams
export const teamPropertyEntity = pgTable("team_properties", {
  id: text("id").primaryKey().$defaultFn(createId),
  teamId: text("team_id")
    .notNull()
    .references(() => teamEntity.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => propertyEntity.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const teamPropertyRelations = relations(
  teamPropertyEntity,
  ({ one }) => ({
    team: one(teamEntity, {
      fields: [teamPropertyEntity.teamId],
      references: [teamEntity.id],
    }),
    property: one(propertyEntity, {
      fields: [teamPropertyEntity.propertyId],
      references: [propertyEntity.id],
    }),
  })
);

// Types
export type TeamProperty = typeof teamPropertyEntity.$inferSelect;
export type NewTeamProperty = typeof teamPropertyEntity.$inferInsert;
