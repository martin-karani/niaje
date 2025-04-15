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
} as const;

const ac = createAccessControl(statement);

// Define roles with specific permissions
const owner = ac.newRole({
  property: ["create", "update", "delete", "view"],
  tenant: ["approve", "remove", "view"],
  financial: ["view", "manage"],
  staff: ["assign", "remove", "view"],
  maintenance: ["view", "manage"],
});

const caretaker = ac.newRole({
  property: ["view"],
  tenant: ["view", "manage"],
  financial: ["record"],
  maintenance: ["create", "update", "view"],
  communication: ["tenant", "landlord"],
});

const agent = ac.newRole({
  property: ["view"],
  tenant: ["create", "view", "manage"],
  lease: ["create", "update", "view"],
  financial: ["invoice", "view_limited"],
  communication: ["tenant", "landlord", "caretaker"],
});

export { ac, agent, caretaker, owner };
