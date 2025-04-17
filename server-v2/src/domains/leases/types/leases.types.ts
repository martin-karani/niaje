export const leasesTypeDefs = `

  enum LeaseStatus {
    draft
    active
    expired
    terminated
    pending_renewal
    future
  }

  enum PaymentFrequency {
    monthly
    weekly
    bi_weekly
    quarterly
    yearly
  }

  enum UtilityBillingType {
    tenant_pays_provider
    tenant_pays_landlord_metered
    tenant_pays_landlord_fixed
    landlord_pays
    included_in_rent
  }

  enum LateFeeType {
    fixed
    percentage
    no_fee
  }

  type Lease {
    id: ID!
    organizationId: ID!
    unitId: ID!
    propertyId: ID!
    status: LeaseStatus!
    startDate: String! # Date as String
    endDate: String! # Date as String
    moveInDate: String # Date as String
    moveOutDate: String # Date as String
    rentAmount: Float!
    depositAmount: Float
    paymentDay: Int!
    paymentFrequency: PaymentFrequency!
    gracePeriodDays: Int
    lateFeeType: LateFeeType
    lateFeeAmount: Float
    lateFeeMaxAmount: Float
    waterBillingType: UtilityBillingType
    electricityBillingType: UtilityBillingType
    gasBillingType: UtilityBillingType
    internetBillingType: UtilityBillingType
    trashBillingType: UtilityBillingType
    waterFixedAmount: Float
    electricityFixedAmount: Float
    gasFixedAmount: Float
    internetFixedAmount: Float
    trashFixedAmount: Float
    petsAllowed: Boolean
    petPolicyNotes: String
    smokingAllowed: Boolean
    leaseTerminationTerms: String
    createdBy: ID
    notes: String
    createdAt: String! # Timestamp as String
    updatedAt: String! # Timestamp as String

    # Relations
    organization: Organization! # Assuming Organization type exists
    unit: Unit!               # Assuming Unit type exists
    property: Property!         # Assuming Property type exists
    creator: User             # Assuming User type exists
    tenantAssignments: [LeaseTenant!] # Assuming LeaseTenant type exists
    tenants: [Tenant!]          # Resolved list of tenants
    payments: [Payment!]        # Assuming Payment type exists
    utilityBills: [UtilityBill!] # Assuming UtilityBill type exists
    documents: [Document!]      # Assuming Document type exists
  }

  input CreateLeaseInput {
    unitId: ID!
    # propertyId: ID! # Derived from unitId in service
    status: LeaseStatus
    startDate: String!
    endDate: String!
    moveInDate: String
    moveOutDate: String
    rentAmount: Float!
    depositAmount: Float
    paymentDay: Int
    paymentFrequency: PaymentFrequency
    gracePeriodDays: Int
    lateFeeType: LateFeeType
    lateFeeAmount: Float
    lateFeeMaxAmount: Float
    waterBillingType: UtilityBillingType
    electricityBillingType: UtilityBillingType
    gasBillingType: UtilityBillingType
    internetBillingType: UtilityBillingType
    trashBillingType: UtilityBillingType
    waterFixedAmount: Float
    electricityFixedAmount: Float
    gasFixedAmount: Float
    internetFixedAmount: Float
    trashFixedAmount: Float
    petsAllowed: Boolean
    petPolicyNotes: String
    smokingAllowed: Boolean
    leaseTerminationTerms: String
    notes: String
    # organizationId: ID! # Usually derived from context
    # createdBy: ID! # Usually derived from context user
  }

  input UpdateLeaseInput {
    id: ID! # Required for update
    status: LeaseStatus
    startDate: String
    endDate: String
    moveInDate: String
    moveOutDate: String
    rentAmount: Float
    depositAmount: Float
    paymentDay: Int
    paymentFrequency: PaymentFrequency
    gracePeriodDays: Int
    lateFeeType: LateFeeType
    lateFeeAmount: Float
    lateFeeMaxAmount: Float
    waterBillingType: UtilityBillingType
    electricityBillingType: UtilityBillingType
    gasBillingType: UtilityBillingType
    internetBillingType: UtilityBillingType
    trashBillingType: UtilityBillingType
    waterFixedAmount: Float
    electricityFixedAmount: Float
    gasFixedAmount: Float
    internetFixedAmount: Float
    trashFixedAmount: Float
    petsAllowed: Boolean
    petPolicyNotes: String
    smokingAllowed: Boolean
    leaseTerminationTerms: String
    notes: String
  }

  extend type Query {
    leases: [Lease!]!
    lease(id: ID!): Lease
    leasesByProperty(propertyId: ID!): [Lease!]!
    leasesByUnit(unitId: ID!): [Lease!]!
    leasesByTenant(tenantId: ID!): [Lease!]!
  }

  extend type Mutation {
    createLease(data: CreateLeaseInput!): Lease!
    updateLease(data: UpdateLeaseInput!): Lease!
    deleteLease(id: ID!): Boolean!
  }
`;
