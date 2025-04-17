export const reportsTypeDefs = `
  # Period information
  type PeriodInfo {
    start: String!
    end: String!
  }

  # Financial summary data
  type FinancialSummary {
    income: Float!
    expenses: Float!
    netIncome: Float!
    currency: String!
  }

  # Category breakdown
  type CategoryBreakdown {
    category: String!
    amount: Float!
  }

  # Monthly financial data
  type MonthlyData {
    month: String!
    income: Float!
    expenses: Float!
    netIncome: Float!
  }

  # Occupancy information
  type OccupancyInfo {
    totalUnits: Int!
    occupiedUnits: Int!
    occupancyRate: Float!
  }

  # Simple property info for reports
  type PropertySummary {
    id: ID!
    name: String!
  }

  # Complete financial report
  type FinancialReport {
    period: PeriodInfo!
    summary: FinancialSummary!
    incomeBreakdown: [CategoryBreakdown!]!
    expenseBreakdown: [CategoryBreakdown!]!
    monthlyData: [MonthlyData!]!
    occupancy: OccupancyInfo!
    properties: [PropertySummary!]!
  }

  # Maintenance summary data
  type MaintenanceSummary {
    totalRequests: Int!
    completedRequests: Int!
    openRequests: Int!
    completionRate: Float!
    avgResolutionDays: Float!
    totalCost: Float!
    avgCost: Float!
    currency: String!
  }

  # Priority breakdown
  type PriorityBreakdown {
    priority: String!
    count: Int!
  }

  # Category count
  type CategoryCount {
    category: String!
    count: Int!
  }

  # Property maintenance data
  type PropertyMaintenance {
    propertyId: ID!
    propertyName: String!
    count: Int!
    completed: Int!
    totalCost: Float!
  }

  # Maintenance request details
  type MaintenanceDetails {
    id: ID!
    title: String!
    status: String!
    priority: String!
    category: String
    createdAt: String!
    completedDate: String
    actualCost: Float
    propertyName: String!
    unitName: String
    reporterName: String
    assigneeName: String
  }

  # Complete maintenance report
  type MaintenanceReport {
    period: PeriodInfo!
    summary: MaintenanceSummary!
    priorityBreakdown: [PriorityBreakdown!]!
    categoryBreakdown: [CategoryCount!]!
    propertyBreakdown: [PropertyMaintenance!]!
    requests: [MaintenanceDetails!]!
  }

  # Tenant lease information
  type TenantLease {
    id: ID!
    unitName: String!
    propertyName: String!
    startDate: String!
    endDate: String!
    rentAmount: Float!
    isPrimary: Boolean!
  }

  # Tenant details
  type TenantDetails {
    id: ID!
    name: String!
    email: String!
    phone: String
    status: String!
    leaseCount: Int!
    totalRent: Float!
    propertyCount: Int!
    maintenanceRequests: Int!
    leases: [TenantLease!]!
  }

  # Complete tenant report
  type TenantReport {
    totalTenants: Int!
    tenants: [TenantDetails!]!
  }

  # Extend Query type with report queries
  extend type Query {
    financialReport(
      startDate: String!
      endDate: String!
      propertyId: ID
    ): FinancialReport!

    maintenanceReport(
      startDate: String!
      endDate: String!
      propertyId: ID
    ): MaintenanceReport!

    tenantReport(
      propertyId: ID
    ): TenantReport!
  }
`;
