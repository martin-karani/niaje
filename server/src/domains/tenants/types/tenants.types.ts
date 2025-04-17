export const tenantsTypeDefs = `

  enum TenantStatus {
    prospect
    active
    past
    rejected
    blacklisted
  }

  type Tenant {
    id: ID!
    organizationId: ID!
    userId: ID # Optional link to user account
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    status: TenantStatus!
    dateOfBirth: String # Date as String
    occupation: String
    employer: String
    income: Float
    emergencyContactName: String
    emergencyContactRelation: String
    emergencyContactPhone: String
    emergencyContactEmail: String
    expectedMoveInDate: String # Date as String
    actualMoveInDate: String # Date as String
    expectedMoveOutDate: String # Date as String
    actualMoveOutDate: String # Date as String
    notes: String
    createdAt: String! # Timestamp as String
    updatedAt: String! # Timestamp as String

    # Relations
    organization: Organization! # Assuming Organization type exists
    userAccount: User          # Assuming User type exists
    leaseAssignments: [LeaseTenant!] # Assignments to leases
    leases: [Lease!]           # Direct access to leases (resolved)
    payments: [Payment!]       # Assuming Payment type exists
    documents: [Document!]     # Assuming Document type exists
    communications: [Communication!] # Assuming Communication type exists
  }

  # Join table representation
  type LeaseTenant {
     id: ID!
     leaseId: ID!
     tenantId: ID!
     isPrimary: Boolean!
     createdAt: String!

     # Relations
     lease: Lease!
     tenant: Tenant!
  }

  input CreateTenantInput {
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    userId: ID
    status: TenantStatus
    dateOfBirth: String
    occupation: String
    employer: String
    income: Float
    emergencyContactName: String
    emergencyContactRelation: String
    emergencyContactPhone: String
    emergencyContactEmail: String
    expectedMoveInDate: String
    actualMoveInDate: String
    expectedMoveOutDate: String
    actualMoveOutDate: String
    notes: String
    # organizationId: ID! # Usually derived from context
  }

  input UpdateTenantInput {
    id: ID! # Required for update
    firstName: String
    lastName: String
    email: String
    phone: String
    userId: ID
    status: TenantStatus
    dateOfBirth: String
    occupation: String
    employer: String
    income: Float
    emergencyContactName: String
    emergencyContactRelation: String
    emergencyContactPhone: String
    emergencyContactEmail: String
    expectedMoveInDate: String
    actualMoveInDate: String
    expectedMoveOutDate: String
    actualMoveOutDate: String
    notes: String
  }

  input AssignTenantToLeaseInput {
    leaseId: ID!
    tenantId: ID!
    isPrimary: Boolean
  }

  extend type Query {
    tenants: [Tenant!]!
    tenant(id: ID!): Tenant
    tenantsByLease(leaseId: ID!): [Tenant!]!
  }

  extend type Mutation {
    createTenant(data: CreateTenantInput!): Tenant!
    updateTenant(data: UpdateTenantInput!): Tenant!
    deleteTenant(id: ID!): Boolean!

    assignTenantToLease(data: AssignTenantToLeaseInput!): LeaseTenant!
    removeTenantFromLease(leaseId: ID!, tenantId: ID!): Boolean!
  }
`;
