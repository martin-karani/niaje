export const documentTypeDefs = `
  enum DocumentType {
    lease_agreement
    tenant_id
    property_photo
    unit_photo
    inspection_report
    maintenance_invoice
    rental_application
    notice_to_vacate
    eviction_notice
    receipt
    contract
    other
  }

  enum StorageProvider {
    local
    s3
    azure
  }

  type Document {
    id: ID!
    organizationId: ID!
    fileName: String!
    fileType: DocumentType!
    mimeType: String!
    fileSize: Int!
    
    storageProvider: StorageProvider!
    storagePath: String!
    url: String!
    
    description: String
    
    uploadedBy: ID
    
    relatedPropertyId: ID
    relatedUnitId: ID
    relatedLeaseId: ID
    relatedTenantId: ID
    relatedInspectionId: ID
    
    createdAt: String!
    updatedAt: String!
    
    # Relations
    organization: Organization!
    uploader: User
    property: Property
    unit: Unit
    lease: Lease
    tenant: Tenant
    inspection: Inspection
  }

  input UploadDocumentInput {
    fileName: String!
    fileType: DocumentType!
    description: String
    relatedPropertyId: ID
    relatedUnitId: ID
    relatedLeaseId: ID
    relatedTenantId: ID
    relatedInspectionId: ID
  }

  extend type Query {
    documents: [Document!]!
    document(id: ID!): Document
    documentsByProperty(propertyId: ID!): [Document!]!
    documentsByLease(leaseId: ID!): [Document!]!
    documentsByTenant(tenantId: ID!): [Document!]!
    documentsByInspection(inspectionId: ID!): [Document!]!
  }

  extend type Mutation {
    uploadDocument(data: UploadDocumentInput!): Document!
    deleteDocument(id: ID!): Boolean!
    updateDocumentDetails(id: ID!, description: String): Document!
  }
`;
