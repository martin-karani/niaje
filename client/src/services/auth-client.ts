// src/auth/auth-client.ts
import { createAuthClient } from "better-auth/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
} from "better-auth/plugins/organization/access";

// Define custom permissions for our property management system
// This should be identical to the server-side statements
const statements = {
  ...defaultStatements,
  property: ["create", "read", "update", "delete", "assign"],
  tenant: ["create", "read", "update", "delete", "contact"],
  lease: ["create", "read", "update", "delete", "renew", "terminate"],
  payment: ["create", "read", "update", "delete", "process", "refund"],
  maintenance: ["create", "read", "update", "delete", "assign", "complete"],
  report: ["create", "read", "export"],
  settings: ["read", "update"],
} as const;

// Create access control
const ac = createAccessControl(statements);

// Define roles with specific permissions
// These should match the server-side role definitions
const owner = ac.newRole({
  ...adminAc.statements,
  property: ["create", "read", "update", "delete", "assign"],
  tenant: ["create", "read", "update", "delete", "contact"],
  lease: ["create", "read", "update", "delete", "renew", "terminate"],
  payment: ["create", "read", "update", "delete", "process", "refund"],
  maintenance: ["create", "read", "update", "delete", "assign", "complete"],
  report: ["create", "read", "export"],
  settings: ["read", "update"],
});

const manager = ac.newRole({
  organization: ["update"],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
  property: ["create", "read", "update", "assign"],
  tenant: ["create", "read", "update", "contact"],
  lease: ["create", "read", "update", "renew"],
  payment: ["create", "read", "process"],
  maintenance: ["create", "read", "update", "assign", "complete"],
  report: ["create", "read", "export"],
  settings: ["read"],
});

const agent = ac.newRole({
  property: ["read", "update"],
  tenant: ["read", "contact"],
  lease: ["read", "update"],
  payment: ["read", "create"],
  maintenance: ["create", "read", "update", "complete"],
  report: ["read"],
});

const propertyOwner = ac.newRole({
  property: ["read"],
  tenant: ["read"],
  lease: ["read"],
  payment: ["read"],
  maintenance: ["read", "create"],
  report: ["read"],
});

const caretaker = ac.newRole({
  property: ["read"],
  tenant: ["read", "contact"],
  maintenance: ["read", "update", "create", "complete"],
});

const tenant = ac.newRole({
  lease: ["read"],
  payment: ["read", "create"],
  maintenance: ["read", "create"],
});

// Create and export the auth client
export const authClient = createAuthClient({
  plugins: [
    // Organization plugin
    organizationClient({
      ac,
      roles: {
        owner,
        admin: manager,
        member: agent,
        propertyOwner,
        caretaker,
        tenant,
      },
      // Team configuration
      teams: {
        enabled: true,
      },
    }),

    // Admin plugin
    adminClient({
      ac,
      roles: {
        admin: owner, // Map 'admin' role to our 'owner' role
        user: agent, // Map 'user' role to our 'agent' role
      },
    }),
  ],
});

export default authClient;
