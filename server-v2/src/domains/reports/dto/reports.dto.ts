// src/domains/billing/dto/reports.dto.ts
import { z } from "zod";

// Base report request schema with period range
export const reportPeriodDto = z.object({
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "startDate must be a valid date string",
    }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "endDate must be a valid date string",
    }),
  propertyId: z.string().optional(),
});

// Financial report request
export const financialReportDto = reportPeriodDto.extend({});

// Maintenance report request
export const maintenanceReportDto = reportPeriodDto.extend({});

// Tenant report request
export const tenantReportDto = z.object({
  propertyId: z.string().optional(),
});

// Types based on the schemas
export type ReportPeriodDto = z.infer<typeof reportPeriodDto>;
export type FinancialReportDto = z.infer<typeof financialReportDto>;
export type MaintenanceReportDto = z.infer<typeof maintenanceReportDto>;
export type TenantReportDto = z.infer<typeof tenantReportDto>;

// Response Types
// These are more for documentation and type checking than validation

export interface PeriodInfo {
  start: string;
  end: string;
}

export interface FinancialSummary {
  income: number;
  expenses: number;
  netIncome: number;
  currency: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  netIncome: number;
}

export interface OccupancyInfo {
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
}

export interface PropertySummary {
  id: string;
  name: string;
}

export interface FinancialReportResponse {
  period: PeriodInfo;
  summary: FinancialSummary;
  incomeBreakdown: CategoryBreakdown[];
  expenseBreakdown: CategoryBreakdown[];
  monthlyData: MonthlyData[];
  occupancy: OccupancyInfo;
  properties: PropertySummary[];
}

export interface MaintenanceSummary {
  totalRequests: number;
  completedRequests: number;
  openRequests: number;
  completionRate: number;
  avgResolutionDays: number;
  totalCost: number;
  avgCost: number;
  currency: string;
}

export interface PriorityBreakdown {
  priority: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface PropertyMaintenance {
  propertyId: string;
  propertyName: string;
  count: number;
  completed: number;
  totalCost: number;
}

export interface MaintenanceDetails {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  createdAt: string;
  completedDate?: string;
  actualCost?: number;
  propertyName: string;
  unitName?: string;
  reporterName?: string;
  assigneeName?: string;
}

export interface MaintenanceReportResponse {
  period: PeriodInfo;
  summary: MaintenanceSummary;
  priorityBreakdown: PriorityBreakdown[];
  categoryBreakdown: CategoryCount[];
  propertyBreakdown: PropertyMaintenance[];
  requests: MaintenanceDetails[];
}

export interface TenantLease {
  id: string;
  unitName: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  isPrimary: boolean;
}

export interface TenantDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  leaseCount: number;
  totalRent: number;
  propertyCount: number;
  maintenanceRequests: number;
  leases: TenantLease[];
}

export interface TenantReportResponse {
  totalTenants: number;
  tenants: TenantDetails[];
}
