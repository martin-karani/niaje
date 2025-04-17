export const maintenanceTypeDefs = `
  enum MaintenanceStatus {
    reported
    scheduled
    in_progress
    on_hold
    completed
    canceled
    requires_owner_approval
  }

  enum MaintenancePriority {
    low
    medium
    high
    urgent
  }

  enum MaintenanceCategory {
    plumbing
    electrical
    hvac
    appliances
    structural
    landscaping
    pest_control
    cleaning
    other
  }

  type MaintenanceRequest {
    id: ID!
    organizationId: ID!
    propertyId: ID!
    unitId: ID
    status: MaintenanceStatus!
    priority: MaintenancePriority!
    category: MaintenanceCategory
    title: String!
    description: String!
    permissionToEnter: Boolean!
    preferredAvailability: String
    reportedBy: ID
    assignedTo: ID
    vendor: String
    scheduledDate: String
    completedDate: String
    estimatedCost: Float
    actualCost: Float
    notes: String
    imagesBefore: [String!]
    imagesAfter: [String!]
    createdAt: String!
    updatedAt: String!

    # Relations
    property: Property!
    unit: Unit
    reporter: User
    assignee: User
  }

  input CreateMaintenanceRequestInput {
    propertyId: ID!
    unitId: ID
    title: String!
    description: String!
    priority: MaintenancePriority
    category: MaintenanceCategory
    permissionToEnter: Boolean
    preferredAvailability: String
    reportedBy: ID
    estimatedCost: Float
    scheduledDate: String
    imageUrls: [String!]
  }

  input UpdateMaintenanceRequestInput {
    id: ID!
    status: MaintenanceStatus
    priority: MaintenancePriority
    title: String
    description: String
    assignedTo: ID
    scheduledDate: String
    completedDate: String
    actualCost: Float
    notes: String
    imagesAfter: [String!]
    vendor: String
  }

  input AssignMaintenanceRequestInput {
    id: ID!
    assigneeId: ID!
  }

  extend type Query {
    maintenanceRequests: [MaintenanceRequest!]!
    maintenanceRequest(id: ID!): MaintenanceRequest
    maintenanceRequestsByProperty(propertyId: ID!): [MaintenanceRequest!]!
    maintenanceRequestsByUnit(unitId: ID!): [MaintenanceRequest!]!
    maintenanceRequestsByAssignee(assigneeId: ID!): [MaintenanceRequest!]!
  }

  extend type Mutation {
    createMaintenanceRequest(data: CreateMaintenanceRequestInput!): MaintenanceRequest!
    updateMaintenanceRequest(data: UpdateMaintenanceRequestInput!): MaintenanceRequest!
    assignMaintenanceRequest(data: AssignMaintenanceRequestInput!): MaintenanceRequest!
    deleteMaintenanceRequest(id: ID!): Boolean!
  }
`;
