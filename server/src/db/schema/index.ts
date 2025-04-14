import { relations } from "drizzle-orm";
import { accounts, accountsRelations } from "./accounts";
import { activitiesRelations } from "./activities";
import { documents, documentsRelations } from "./documents";
import {
  maintenanceCategoriesRelations,
  maintenanceComments,
  maintenanceCommentsRelations,
  maintenanceRequests,
  maintenanceRequestsRelations,
  workOrdersRelations,
} from "./maintenance";
import {
  messageRecipientsRelations,
  messagesRelations,
  messageTemplatesRelations,
} from "./messages";
import {
  transactions,
  transactionsRelations,
  utilityBillsRelations,
} from "./payments";
import {
  leases,
  leasesRelations,
  properties,
  propertiesRelations,
  unitsRelations,
} from "./properties";
import { sessions, sessionsRelations } from "./sessions";
import {
  notifications,
  notificationsRelations,
  tenants,
  userPermissions,
  userPermissionsRelations,
  users,
} from "./users";
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
  maintenanceAssignments: many(maintenanceRequests, {
    relationName: "maintenanceAssignee",
  }),
  maintenanceComments: many(maintenanceComments, {
    relationName: "commentAuthor",
  }),
  uploadedDocuments: many(documents, {
    relationName: "documentUploader",
  }),
  permissions: many(userPermissions),
  grantedPermissions: many(userPermissions, {
    relationName: "permissionGrantor",
  }),
  notifications: many(notifications, {
    relationName: "notificationRecipient",
  }),
  createdLeases: many(leases, {
    relationName: "leaseCreator",
  }),
  recordedTransactions: many(transactions, {
    relationName: "transactionRecorder",
  }),
}));

const tenantsRelations = relations(tenants, ({ many }) => ({
  leases: many(leases),
  maintenanceRequests: many(maintenanceRequests),
}));

export * from "./accounts";
export * from "./activities";
export * from "./audit";
export * from "./documents";
export * from "./maintenance";
export * from "./messages";
export * from "./payments";
export * from "./properties";
export * from "./sessions";
export * from "./users";
export * from "./verifications";

export {
  accountsRelations,
  activitiesRelations,
  documentsRelations,
  leasesRelations,
  maintenanceCategoriesRelations,
  maintenanceCommentsRelations,
  maintenanceRequestsRelations,
  messageRecipientsRelations,
  messagesRelations,
  messageTemplatesRelations,
  notificationsRelations,
  propertiesRelations,
  sessionsRelations,
  tenantsRelations,
  transactionsRelations,
  unitsRelations,
  userPermissionsRelations,
  usersRelations,
  utilityBillsRelations,
  verificationsRelations,
  workOrdersRelations,
};
