import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  property: ["create", "update", "delete", "view"],
  tenant: ["create", "approve", "remove", "view", "manage"],
  financial: ["view", "manage", "record", "invoice", "view_limited"],
  staff: ["assign", "remove", "view"],
  maintenance: ["create", "update", "view", "manage"],
  lease: ["create", "update", "view"],
  communication: ["tenant", "landlord", "caretaker"],
  tenant_portal: ["access", "make_payment", "view_lease", "create_maintenance"] // New permissions for tenant portal
} as const;

const ac = createAccessControl(statement);

// Define roles with specific permissions
// Agent has full control
const agent = ac.newRole({
  property: ["create", "update", "delete", "view"], 
  tenant: ["create", "approve", "remove", "view", "manage"],
  financial: ["view", "manage", "record", "invoice"],
  staff: ["assign", "remove", "view"],
  maintenance: ["create", "update", "view", "manage"],
  lease: ["create", "update", "view"],
  communication: ["tenant", "landlord", "caretaker"],
  tenant_portal: ["access"], // Can enable tenant portal access
});

// Property owner can view their properties
const owner = ac.newRole({
  property: ["view"],
  tenant: ["view"],
  financial: ["view_limited"],
  maintenance: ["view"],
});

// Caretaker can manage maintenance and tenant communication
const caretaker = ac.newRole({
  property: ["view"],
  tenant: ["view", "manage"],
  financial: ["record"],
  maintenance: ["create", "update", "view"],
  communication: ["tenant", "landlord"],
});

// Tenant portal user can access portal features
const tenant_user = ac.newRole({
  property: [], // No direct property access
  tenant: [], // No tenant management
  financial: [], // No financial management
  maintenance: ["create", "view"], // Can create and view their maintenance requests
  lease: ["view"], // Can view their lease details
  tenant_portal: ["access", "make_payment", "view_lease", "create_maintenance"], // Full tenant portal access
  communication: ["caretaker"], // Can communicate with caretakers
});

export { ac, agent, caretaker, owner, tenant_user };
