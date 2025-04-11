import {
  boolean,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { properties } from "./properties";
// import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "LANDLORD",
  "CARETAKER",
  "AGENT",
  "ADMIN",
]);

// Define users table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  phone: text("phone"),
  role: userRoleEnum("role").default("LANDLORD").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  dateOfBirth: timestamp("date_of_birth"),
  status: text("status").default("active").notNull(), // active, past, blacklisted
  documents: json("documents"), // IDs, references or URLs to tenant documents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPermissions = pgTable(
  "user_permissions",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // caretaker, agent, readonly, custom

    canManageTenants: boolean("can_manage_tenants").default(false),
    canManageLeases: boolean("can_manage_leases").default(false),
    canCollectPayments: boolean("can_collect_payments").default(false),
    canViewFinancials: boolean("can_view_financials").default(false),
    canManageMaintenance: boolean("can_manage_maintenance").default(false),
    canManageProperties: boolean("can_manage_properties").default(false),

    grantedBy: text("granted_by")
      .notNull()
      .references(() => users.id), // Landlord who granted permission
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      // Use uniqueIndex instead of index().unique()
      providerAccountIdx: uniqueIndex("user_permissions_idx").on(
        table.userId,
        table.propertyId
      ),
    };
  }
);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // payment_due, maintenance, lease
  relatedId: text("related_id"), // ID of related entity
  relatedType: text("related_type"), // Type of related entity
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// // Define relations for the users table
// export const usersRelations = relations(users, ({ many, one }) => ({
//   // One-to-many relations where user is an owner of properties
//   ownedProperties: many(/* properties table will be imported later */),

//   // One-to-many relations where user is a caretaker of properties
//   managedProperties: many(/* properties table will be imported later */),

//   // One-to-many relations where user is an agent for properties
//   representedProperties: many(/* properties table will be imported later */),

//   // One-to-many relation with accounts
//   accounts: many(/* accounts table will be imported later */),

//   // One-to-many relation with sessions
//   sessions: many(/* sessions table will be imported later */),

//   // One-to-many relation with verifications
//   verifications: many(/* verifications table will be imported later */),
// }));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
