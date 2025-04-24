export const usersTypeDefs = `
  enum UserRole {
    agent_owner
    agent_staff
    property_owner
    caretaker
    tenant_user
    admin
  }

  type User {
    id: ID!
    name: String!
    email: String!
    emailVerified: Boolean!
    image: String
    phone: String
    role: UserRole!
    isActive: Boolean!
    address: String
    city: String
    country: String
    bio: String
    lastLoginAt: String
    createdAt: String!
    updatedAt: String!

    # Computed fields - based on relationships
    ownedOrganizations: [Organization!]
    organizationMemberships: [Member!]
    ownedProperties: [Property!]
    caretakerProperties: [Property!]
  }

  type Session {
    id: ID!
    userId: ID!
    expiresAt: String!
    token: String!
    ipAddress: String
    userAgent: String
    createdAt: String!
    updatedAt: String!
    data: String # JSON data
    
    user: User
  }

  type Account {
    id: ID!
    userId: ID!
    providerId: String!
    accountId: String!
    accessToken: String
    refreshToken: String
    scope: String
    createdAt: String!
    updatedAt: String!
    
    user: User
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    passwordConfirm: String!
    role: UserRole!
    phone: String
    image: String
    address: String
    city: String
    country: String
    bio: String
    isActive: Boolean
  }

  input UpdateUserInput {
    id: ID!
    name: String
    email: String
    role: UserRole
    phone: String
    image: String
    address: String
    city: String
    country: String
    bio: String
    isActive: Boolean
  }

  input ChangePasswordInput {
    id: ID!
    currentPassword: String!
    newPassword: String!
    confirmPassword: String!
  }

  input CreateTenantUserInput {
    email: String!
    name: String!
    phone: String
    tenantId: ID!
    password: String
    sendCredentials: Boolean
  }

  extend type Query {
    users: [User!]!
    user(id: ID!): User
    tenantUsers: [Tenant!]!
  }

  extend type Mutation {
    updateUser(data: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createTenantUser(data: CreateTenantUserInput!): User!
  }
`;
