export const communicationsTypeDefs = `
  enum CommunicationType {
    email
    sms
    in_app_message
    notification
    note
  }

  enum CommunicationChannel {
    system_generated
    user_sent
    tenant_portal
    owner_portal
  }

  enum CommunicationStatus {
    draft
    sent
    delivered
    read
    failed
    scheduled
  }

  type Communication {
    id: ID!
    organizationId: ID!
    type: CommunicationType!
    channel: CommunicationChannel!
    status: CommunicationStatus!
    
    senderUserId: ID
    recipientUserId: ID
    recipientTenantId: ID
    
    subject: String
    body: String!
    
    relatedPropertyId: ID
    relatedLeaseId: ID
    relatedMaintenanceId: ID
    
    isRead: Boolean!
    readAt: String
    scheduledSendAt: String
    sentAt: String
    deliveredAt: String
    failedReason: String
    
    metadata: String # JSON string
    createdAt: String!
    updatedAt: String!
    
    # Relations
    sender: User
    recipientUser: User
    recipientTenant: Tenant
    property: Property
    lease: Lease
    maintenanceRequest: MaintenanceRequest
  }

  input CreateCommunicationInput {
    type: CommunicationType!
    channel: CommunicationChannel!
    recipientUserId: ID
    recipientTenantId: ID
    subject: String
    body: String!
    relatedPropertyId: ID
    relatedLeaseId: ID
    relatedMaintenanceId: ID
    scheduledSendAt: String
    sendEmail: Boolean
  }

  extend type Query {
    communications: [Communication!]!
    userCommunications(userId: ID!): [Communication!]!
    tenantCommunications(tenantId: ID!): [Communication!]!
    unreadCommunications: [Communication!]!
  }

  extend type Mutation {
    createCommunication(data: CreateCommunicationInput!): Communication!
    markCommunicationAsRead(id: ID!): Communication!
    deleteCommunication(id: ID!): Boolean!
  }
`;
