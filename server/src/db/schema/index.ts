import { relations } from "drizzle-orm";
import { accounts, accountsRelations } from "./accounts";
import { properties, propertiesRelations } from "./properties";
import { sessions, sessionsRelations } from "./sessions";
import { users } from "./users";
import { verifications, verificationsRelations } from "./verifications";

const usersRelations = relations(users, ({ many }) => ({
  ownedProperties: many(properties, {
    relationName: "propertyOwner",
  }),
  managedProperties: many(properties, {
    relationName: "propertyCaretaker",
  }),
  representedProperties: many(properties, {
    relationName: "propertyAgent",
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  verifications: many(verifications),
}));

export * from "./accounts";
export * from "./audit";
export * from "./documents";
export * from "./maintenance";
export * from "./payments";
export * from "./properties";
export * from "./sessions";
export * from "./users";
export * from "./verifications";

export {
  accountsRelations,
  propertiesRelations,
  sessionsRelations,
  usersRelations,
  verificationsRelations,
};
