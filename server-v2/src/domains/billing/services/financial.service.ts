// src/domains/billing/services/financial.service.ts
import { unitEntity } from "@domains/properties/entities/unit.entity";
import { db } from "@infrastructure/database";
import { eq } from "drizzle-orm";
import { expensesService } from "./expenses.service";
import { paymentsService } from "./payments.service";

// Define a Period type for date ranges
type Period = "month" | "quarter" | "year" | "custom";

interface PeriodInfo {
  start: Date;
  end: Date;
}

interface FinancialSummary {
  period: PeriodInfo;
  income: number;
  expenses: number;
  netIncome: number;
  rentCollectionRate: number;
  currency: string;
  occupancyRate?: number;
  totalUnits?: number;
  occupiedUnits?: number;
}

export class FinancialService {
  /**
   * Calculate financial summary for a property
   */
  async getPropertyFinancialSummary(
    propertyId: string,
    organizationId: string,
    period: Period = "month",
    startDate?: string,
    endDate?: string
  ): Promise<FinancialSummary> {
    // Determine date range based on period
    const dateRange = this.calculateDateRange(period, startDate, endDate);

    // Get income data
    const income = await paymentsService.getPropertyIncome(
      propertyId,
      dateRange.start,
      dateRange.end,
      organizationId
    );

    // Get expense data
    const expenses = await expensesService.getPropertyExpenses(
      propertyId,
      dateRange.start,
      dateRange.end,
      organizationId
    );

    // Calculate net income
    const netIncome = income - expenses;

    // Calculate rent collection rate (TODO: implement properly)
    // This would involve comparing expected rent vs. collected rent
    const rentCollectionRate = 95; // Placeholder value

    // Get occupancy information
    const occupancyInfo = await this.getPropertyOccupancyInfo(propertyId);

    return {
      period: {
        start: dateRange.start,
        end: dateRange.end,
      },
      income,
      expenses,
      netIncome,
      rentCollectionRate,
      currency: "KES", // Default currency, can be made configurable
      ...occupancyInfo,
    };
  }

  /**
   * Helper to calculate date range based on period
   */
  private calculateDateRange(
    period: Period,
    startDateStr?: string,
    endDateStr?: string
  ): PeriodInfo {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === "custom" && startDateStr && endDateStr) {
      start = new Date(startDateStr);
      end = new Date(endDateStr);
    } else {
      // Default periods
      switch (period) {
        case "month":
          // Current month
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          // Current quarter
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case "year":
          // Current year
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          // Default to current month
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    return { start, end };
  }

  /**
   * Get occupancy information for a property
   */
  private async getPropertyOccupancyInfo(propertyId: string): Promise<{
    occupancyRate: number;
    totalUnits: number;
    occupiedUnits: number;
  }> {
    // Get all units for the property
    const units = await db.query.unitEntity.findMany({
      where: eq(unitEntity.propertyId, propertyId),
    });

    const totalUnits = units.length;
    const occupiedUnits = units.filter(
      (unit) => unit.status === "occupied"
    ).length;
    const occupancyRate =
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    return {
      occupancyRate,
      totalUnits,
      occupiedUnits,
    };
  }
}

// Export singleton instance
export const financialService = new FinancialService();
