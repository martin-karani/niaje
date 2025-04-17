export const organizationsTypeDefs = `
  # Organization related types
  type Organization {
    id: ID!
    name: String!
    slug: String!
    agentOwnerId: ID
    
    # Trial information
    trialStatus: String!
    trialStartedAt: String
    trialExpiresAt: String
    
    # Subscription information
    subscriptionStatus: String!
    subscriptionPlan: String
    
    # Limits
    maxProperties: Int!
    maxUsers: Int!
    
    # Settings
    timezone: String!
    currency: String!
    dateFormat: String!
    logo: String
    address: String
    
    # Relations
    owner: User
    members: [Member!]!
    teams: [Team!]!
    
    # Timestamps
    createdAt: String!
    updatedAt: String!
  }
  
  # Team type for organizing users
  type Team {
    id: ID!
    name: String!
    organizationId: ID!
    description: String
    
    # Relations
    members: [Member!]!
    properties: [Property!]!
    
    # Timestamps
    createdAt: String!
    updatedAt: String!
  }
  
  # Organization member
  type Member {
    id: ID!
    organizationId: ID!
    userId: ID!
    teamId: ID
    role: String!
    status: String!
    joinedAt: String
    
    # Relations
    user: User!
    team: Team
    
    # Timestamps
    createdAt: String!
    updatedAt: String!
  }
  
  # Invitation to join organization
  type Invitation {
    id: ID!
    organizationId: ID!
    email: String!
    role: String!
    status: String!
    token: String!
    expiresAt: String!
    
    # Relations
    organization: Organization!
    inviter: User
    
    # Timestamps
    createdAt: String!
    updatedAt: String!
  }
  
  # Invitation validation response
  type InvitationValidation {
    valid: Boolean!
    message: String!
    invitation: Invitation
  }
  
  # Inputs for mutations
  input CreateOrganizationInput {
    name: String!
    slug: String
    timezone: String
    currency: String
    dateFormat: String
    logo: String
    address: String
  }
  
  input UpdateOrganizationInput {
    id: ID!
    name: String
    slug: String
    timezone: String
    currency: String
    dateFormat: String
    logo: String
    address: String
  }
  
  # Extend Query with organization queries
  extend type Query {
    myOrganizations: [Organization!]!
    organization(id: ID!): Organization!
    organizationBySlug(slug: String!): Organization!
    organizationMembers(organizationId: ID!): [Member!]!
    organizationTeams(organizationId: ID!): [Team!]!
    organizationInvitations(organizationId: ID!): [Invitation!]!
    validateInvitation(token: String!): InvitationValidation!
  }
  
  # Extend Mutation with organization mutations
  extend type Mutation {
    # Organization management
    createOrganization(data: CreateOrganizationInput!): Organization!
    updateOrganization(data: UpdateOrganizationInput!): Organization!
    deleteOrganization(id: ID!): Boolean!
    switchOrganization(id: ID!): Organization!
    
    # Invitation management
    inviteToOrganization(organizationId: ID!, email: String!, role: String!, teamId: ID): Invitation!
    revokeInvitation(id: ID!): Invitation!
    resendInvitation(id: ID!): Invitation!
    acceptInvitation(token: String!): Organization!
    
    # Member management
    updateMember(id: ID!, role: String, status: String, teamId: ID): Member!
    removeMember(userId: ID!, organizationId: ID!): Boolean!
    transferOwnership(organizationId: ID!, newOwnerId: ID!): Boolean!
    
    # Team management
    createTeam(name: String!, organizationId: ID!, description: String): Team!
    updateTeam(id: ID!, name: String, description: String): Team!
    deleteTeam(id: ID!): Boolean!
    addUserToTeam(teamId: ID!, userId: ID!, organizationId: ID!): Boolean!
    removeUserFromTeam(teamId: ID!, userId: ID!): Boolean!
    assignPropertiesToTeam(teamId: ID!, propertyIds: [ID!]!, organizationId: ID!): Boolean!
  }
`;
