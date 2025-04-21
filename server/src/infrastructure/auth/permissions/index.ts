import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
} from "better-auth/plugins/organization/access";

/**
 * Define all possible permissions in the system
 * This maps resources to their possible actions
 */
export const statements = {
  ...defaultStatements, // Include default organization permissions

  // Organization management
  organization: ["view", "update", "delete", "manage_subscription"],

  // Staff/team management
  member: ["invite", "remove", "update_role"],
  team: ["create", "update", "delete", "assign_properties"],

  // Property management
  property: [
    "view",
    "create",
    "update",
    "delete",
    "assign_caretaker",
    "list",
    "read",
    "assign",
  ],

  // Unit management
  unit: ["view", "create", "update", "delete", "list", "read", "assign"],

  // Tenant management
  tenant: [
    "view",
    "create",
    "update",
    "delete",
    "contact",
    "list",
    "read",
    "approve",
  ],

  // Lease management
  lease: [
    "view",
    "create",
    "update",
    "delete",
    "terminate",
    "renew",
    "list",
    "read",
  ],

  // Financial management
  payment: ["view", "record", "process", "approve"],
  expense: ["view", "create", "update", "delete"],
  financial: ["view", "record", "manage", "report", "invoice"],

  // Maintenance management
  maintenance: [
    "view",
    "create",
    "update",
    "resolve",
    "assign",
    "read",
    "complete",
    "list",
  ],

  // Document management
  document: ["view", "upload", "delete"],

  // Settings management
  settings: ["read", "update"],

  // Staff management
  staff: ["invite", "remove", "assign", "view"],
} as const;

/**
 * Create the access control system
 */
export const ac = createAccessControl(statements);

/**
 * Organization Owner Role (Agent Owner)
 * Has full control over the organization and all its resources
 */
export const owner = ac.newRole({
  ...adminAc.statements, // Full organization admin capabilities
  organization: ["view", "update", "delete", "manage_subscription"],
  member: ["invite", "remove", "update_role"],
  team: ["create", "update", "delete", "assign_properties"],
  property: [
    "view",
    "create",
    "update",
    "delete",
    "assign_caretaker",
    "list",
    "read",
    "assign",
  ],
  unit: ["view", "create", "update", "delete", "list", "read", "assign"],
  tenant: [
    "view",
    "create",
    "update",
    "delete",
    "contact",
    "list",
    "read",
    "approve",
  ],
  lease: [
    "view",
    "create",
    "update",
    "delete",
    "terminate",
    "renew",
    "list",
    "read",
  ],
  payment: ["view", "record", "process", "approve"],
  expense: ["view", "create", "update", "delete"],
  financial: ["view", "record", "manage", "report", "invoice"],
  maintenance: [
    "view",
    "create",
    "update",
    "resolve",
    "assign",
    "read",
    "complete",
    "list",
  ],
  document: ["view", "upload", "delete"],
  settings: ["read", "update"],
  staff: ["invite", "remove", "assign", "view"],
});

/**
 * Organization Admin Role (Agent Staff with admin privileges)
 * Has most capabilities except organization deletion and owner changes
 */
export const admin = ac.newRole({
  organization: ["view", "update"], // Can update org but not delete
  member: ["invite", "update_role"],
  team: ["create", "update", "assign_properties"],
  property: [
    "view",
    "create",
    "update",
    "delete",
    "assign_caretaker",
    "list",
    "read",
    "assign",
  ],
  unit: ["view", "create", "update", "delete", "list", "read", "assign"],
  tenant: [
    "view",
    "create",
    "update",
    "delete",
    "contact",
    "list",
    "read",
    "approve",
  ],
  lease: [
    "view",
    "create",
    "update",
    "delete",
    "terminate",
    "renew",
    "list",
    "read",
  ],
  payment: ["view", "record", "process", "approve"],
  expense: ["view", "create", "update", "delete"],
  financial: ["view", "record", "manage", "report", "invoice"],
  maintenance: [
    "view",
    "create",
    "update",
    "resolve",
    "assign",
    "read",
    "complete",
    "list",
  ],
  document: ["view", "upload", "delete"],
  settings: ["read", "update"],
  staff: ["view", "invite", "assign"],
});

/**
 * Staff Role (Regular Agent Staff)
 * Has limited access to manage properties and tenants
 */
export const staff = ac.newRole({
  organization: ["view"],
  member: [],
  team: [],
  property: ["view", "read", "update", "list"],
  unit: ["view", "read", "update", "list"],
  tenant: ["view", "read", "update", "contact", "list"],
  lease: ["view", "read", "update", "list"],
  payment: ["view", "record"],
  expense: ["view", "create"],
  financial: ["view", "record", "report"],
  maintenance: [
    "view",
    "create",
    "update",
    "resolve",
    "read",
    "assign",
    "complete",
    "list",
  ],
  document: ["view", "upload"],
  settings: ["read"],
  staff: ["view"],
});

/**
 * Property Owner Role
 * Has read-only access to their properties and tenants
 */
export const propertyOwner = ac.newRole({
  property: ["view", "read", "list"],
  unit: ["view", "read", "list"],
  tenant: ["view", "read", "list"],
  lease: ["view", "read", "list"],
  payment: ["view"],
  expense: ["view"],
  financial: ["view", "report"],
  maintenance: ["view", "create", "read", "list"],
  document: ["view"],
  settings: ["read"],
});

/**
 * Caretaker Role
 * Focused on maintenance and tenant communication
 */
export const caretaker = ac.newRole({
  property: ["view", "read", "list"],
  unit: ["view", "read", "list"],
  tenant: ["view", "read", "contact", "list"],
  lease: ["view", "read", "list"],
  maintenance: [
    "view",
    "create",
    "update",
    "resolve",
    "read",
    "complete",
    "list",
  ],
  document: ["view"],
  settings: ["read"],
});

/**
 * Tenant User Role
 * Very limited access to their lease and maintenance requests
 */
export const tenantUser = ac.newRole({
  lease: ["view", "read"],
  payment: ["view", "record"],
  financial: ["view"],
  maintenance: ["view", "create", "read", "list"],
  document: ["view"],
});

// Export all roles with names that match what Better-Auth expects
export const roles = {
  owner, // For agent_owner
  admin, // For senior staff with admin privileges
  staff, // For regular agent_staff
  propertyOwner, // For property owners
  caretaker, // For property caretakers
  tenantUser, // For tenants
};
