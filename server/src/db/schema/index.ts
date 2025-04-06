import { users, usersRelations } from "./users";
import { properties, propertiesRelations } from "./properties";
import { accounts, accountsRelations } from "./accounts";
import { sessions } from "./sessions";
import { verifications } from "./verifications";

import { relations } from "drizzle-orm";

export const completeUsersRelations = relations(users, ({ many }) => ({
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

export * from "./users";
export * from "./properties";
export * from "./accounts";
export * from "./sessions";
export * from "./verifications";
