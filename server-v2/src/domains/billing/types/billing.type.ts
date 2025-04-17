export const billingTypeDefs = `
  # Payment related types
  enum PaymentMethod {
    cash
    bank_transfer
    mpesa
    credit_card
    debit_card
    cheque
    online_portal
    other
  }

  enum PaymentStatus {
    pending
    successful
    failed
    refunded
    partially_refunded
    disputed
  }

  enum PaymentType {
    rent
    deposit
    late_fee
    utility
    maintenance
    management_fee
    other_income
    owner_payout
    expense_reimbursement
  }

  type Payment {
    id: ID!
    organizationId: ID!
    propertyId: ID
    unitId: ID
    leaseId: ID
    tenantId: ID
    type: PaymentType!
    status: PaymentStatus!
    method: PaymentMethod
    amount: Float!
    currency: String!
    transactionDate: String!
    dueDate: String
    paidDate: String
    description: String
    notes: String
    referenceId: String
    processorResponse: String # JSON string
    recordedBy: ID
    createdAt: String!
    updatedAt: String!

    # Relations
    organization: Organization
    property: Property
    unit: Unit
    lease: Lease
    tenant: Tenant
    recorder: User
    utilityBill: UtilityBill
    expense: Expense
  }

  # Expense related types
  enum ExpenseCategory {
    maintenance_repair
    utilities
    property_tax
    insurance
    management_fee
    advertising
    supplies
    capital_improvement
    other
  }

  type Expense {
    id: ID!
    organizationId: ID!
    propertyId: ID
    unitId: ID
    category: ExpenseCategory!
    amount: Float!
    expenseDate: String!
    description: String!
    vendor: String
    paymentId: ID
    recordedBy: ID
    notes: String
    createdAt: String!
    updatedAt: String!

    # Relations
    organization: Organization
    property: Property
    unit: Unit
    recorder: User
    payment: Payment
  }

  # Utility bill related types
  enum UtilityType {
    water
    electricity
    gas
    internet
    trash
    sewer
    other
  }

  enum UtilityBillStatus {
    due
    paid
    overdue
    canceled
  }

  type UtilityBill {
    id: ID!
    organizationId: ID!
    propertyId: ID!
    unitId: ID!
    leaseId: ID
    tenantId: ID
    utilityType: UtilityType!
    billingPeriodStart: String!
    billingPeriodEnd: String!
    dueDate: String!
    amount: Float!
    status: UtilityBillStatus!
    meterReadingStart: Float
    meterReadingEnd: Float
    consumption: Float
    rate: Float
    paymentId: ID
    notes: String
    createdAt: String!
    updatedAt: String!

    # Relations
    organization: Organization
    property: Property
    unit: Unit
    lease: Lease
    tenant: Tenant
    payment: Payment
  }

  # Financial summary type
  type FinancialSummary {
    period: PeriodInfo!
    income: Float!
    expenses: Float!
    netIncome: Float!
    rentCollectionRate: Float!
    currency: String!
    occupancyRate: Float
    totalUnits: Int
    occupiedUnits: Int
  }

  type PeriodInfo {
    start: String!
    end: String!
  }

  # Input types for mutations
  input CreatePaymentInput {
    propertyId: ID
    unitId: ID
    leaseId: ID
    tenantId: ID
    type: PaymentType!
    method: PaymentMethod!
    amount: Float!
    currency: String
    transactionDate: String
    dueDate: String
    description: String
    notes: String
    referenceId: String
  }

  input UpdatePaymentInput {
    id: ID!
    status: PaymentStatus
    method: PaymentMethod
    amount: Float
    transactionDate: String
    dueDate: String
    paidDate: String
    description: String
    notes: String
    referenceId: String
  }

  input CreateExpenseInput {
    propertyId: ID
    unitId: ID
    category: ExpenseCategory!
    amount: Float!
    expenseDate: String!
    description: String!
    vendor: String
    notes: String
    createPayment: Boolean
  }

  input UpdateExpenseInput {
    id: ID!
    category: ExpenseCategory
    amount: Float
    expenseDate: String
    description: String
    vendor: String
    notes: String
  }

  input CreateUtilityBillInput {
    propertyId: ID!
    unitId: ID!
    leaseId: ID
    tenantId: ID
    utilityType: UtilityType!
    billingPeriodStart: String!
    billingPeriodEnd: String!
    dueDate: String!
    amount: Float!
    status: UtilityBillStatus
    meterReadingStart: Float
    meterReadingEnd: Float
    consumption: Float
    rate: Float
    notes: String
  }

  input UpdateUtilityBillInput {
    id: ID!
    status: UtilityBillStatus
    meterReadingStart: Float
    meterReadingEnd: Float
    consumption: Float
    rate: Float
    amount: Float
    notes: String
    dueDate: String
    billingPeriodStart: String
    billingPeriodEnd: String
  }

  input PayUtilityBillInput {
    id: ID!
    amount: Float!
    paymentMethod: String!
    referenceId: String
    paidDate: String
    notes: String
  }

  # Extend the Query type
  extend type Query {
    # Payment queries
    payments: [Payment!]!
    payment(id: ID!): Payment
    paymentsByProperty(propertyId: ID!): [Payment!]!
    paymentsByLease(leaseId: ID!): [Payment!]!
    paymentsByTenant(tenantId: ID!): [Payment!]!
    
    # Expense queries
    expenses: [Expense!]!
    expense(id: ID!): Expense
    expensesByProperty(propertyId: ID!): [Expense!]!
    
    # Utility bill queries
    utilityBills: [UtilityBill!]!
    utilityBill(id: ID!): UtilityBill
    utilityBillsByProperty(propertyId: ID!): [UtilityBill!]!
    utilityBillsByUnit(unitId: ID!): [UtilityBill!]!
    
    # Financial summary
    propertyFinancialSummary(
      propertyId: ID!, 
      period: String, 
      startDate: String, 
      endDate: String
    ): FinancialSummary!
  }

  # Extend the Mutation type
  extend type Mutation {
    # Payment mutations
    createPayment(data: CreatePaymentInput!): Payment!
    updatePayment(data: UpdatePaymentInput!): Payment!
    deletePayment(id: ID!): Boolean!
    
    # Expense mutations
    createExpense(data: CreateExpenseInput!): Expense!
    updateExpense(data: UpdateExpenseInput!): Expense!
    deleteExpense(id: ID!): Boolean!
    
    # Utility bill mutations
    createUtilityBill(data: CreateUtilityBillInput!): UtilityBill!
    updateUtilityBill(data: UpdateUtilityBillInput!): UtilityBill!
    deleteUtilityBill(id: ID!): Boolean!
    payUtilityBill(data: PayUtilityBillInput!): UtilityBill!
  }
`;
