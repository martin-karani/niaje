export const inspectionsTypeDefs = `
  enum InspectionType {
    move_in
    move_out
    periodic
    drive_by
    safety
    other
  }

  enum InspectionStatus {
    scheduled
    completed
    canceled
    pending_report
  }

  type InspectionFinding {
    area: String!
    item: String!
    condition: String!
    notes: String
    photoUrl: String
  }

  type Inspection {
    id: ID!
    organizationId: ID!
    propertyId: ID!
    unitId: ID
    leaseId: ID
    type: InspectionType!
    status: InspectionStatus!
    scheduledDate: String!
    completedDate: String
    inspectorId: ID
    summary: String
    conditionRating: Int
    notes: String
    findings: [InspectionFinding!]
    tenantSignature: String
    inspectorSignature: String
    createdAt: String!
    updatedAt: String!

    # Relations
    property: Property!
    unit: Unit
    lease: Lease
    inspector: User
    documents: [Document!]
  }

  input InspectionFindingInput {
    area: String!
    item: String!
    condition: String!
    notes: String
    photoUrl: String
  }

  input CreateInspectionInput {
    propertyId: ID!
    unitId: ID
    leaseId: ID
    type: InspectionType!
    scheduledDate: String!
    inspectorId: ID
    summary: String
    conditionRating: Int
    notes: String
    findings: [InspectionFindingInput!]
  }

  input UpdateInspectionInput {
    id: ID!
    status: InspectionStatus
    scheduledDate: String
    completedDate: String
    inspectorId: ID
    summary: String
    conditionRating: Int
    notes: String
    findings: [InspectionFindingInput!]
    tenantSignature: String
    inspectorSignature: String
  }

  input CompleteInspectionInput {
    id: ID!
    summary: String!
    conditionRating: Int!
    notes: String
    findings: [InspectionFindingInput!]!
    tenantSignature: String
    inspectorSignature: String!
    completedDate: String
  }

  extend type Query {
    inspections: [Inspection!]!
    inspection(id: ID!): Inspection!
    inspectionsByProperty(propertyId: ID!): [Inspection!]!
    inspectionsByUnit(unitId: ID!): [Inspection!]!
    inspectionsByLease(leaseId: ID!): [Inspection!]!
    upcomingInspections(limit: Int): [Inspection!]!
  }

  extend type Mutation {
    createInspection(data: CreateInspectionInput!): Inspection!
    updateInspection(data: UpdateInspectionInput!): Inspection!
    completeInspection(data: CompleteInspectionInput!): Inspection!
    cancelInspection(id: ID!, reason: String!): Inspection!
    deleteInspection(id: ID!): Boolean!
    createMoveInInspection(leaseId: ID!, scheduledDate: String!, inspectorId: ID): Inspection!
    createMoveOutInspection(leaseId: ID!, scheduledDate: String!, inspectorId: ID): Inspection!
  }
`;
