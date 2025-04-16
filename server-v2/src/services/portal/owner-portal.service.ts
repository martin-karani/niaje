// src/services/portal/owner-portal.service.ts
import { db } from "@/db";
import { expenses, leases, payments, properties } from "@/db/schema";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { and, between, desc, eq, sum } from "drizzle-orm";

export class OwnerPortalService {
  /**
   * Get owner properties
   */
  async getOwnerProperties(ownerId: string) {
    return db.query.properties.findMany({
      where: eq(properties.ownerId, ownerId),
      with: {
        managingOrganization: true,
        propertyCaretaker: true,
        units: {
          with: {
            activeLease: true,
          },
        },
      },
    });
  }

  /**
   * Get property financial summary
   */
  async getPropertyFinancialSummary(
    propertyId: string,
    ownerId: string,
    period:
      | { startDate: Date; endDate: Date }
      | "current_month"
      | "last_month"
      | "last_3_months"
      | "last_6_months"
      | "year_to_date"
  ) {
    // Verify owner has access to this property
    const propertyAccess = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, propertyId),
        eq(properties.ownerId, ownerId)
      ),
    });

    if (!propertyAccess) {
      throw new Error("Property not found or access denied");
    }

    // Calculate date range based on period
    let startDate: Date, endDate: Date;

    if (typeof period === "object") {
      startDate = period.startDate;
      endDate = period.endDate;
    } else {
      const now = new Date();

      switch (period) {
        case "current_month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "last_month":
          startDate = startOfMonth(subMonths(now, 1));
          endDate = endOfMonth(subMonths(now, 1));
          break;
        case "last_3_months":
          startDate = startOfMonth(subMonths(now, 3));
          endDate = endOfMonth(now);
          break;
        case "last_6_months":
          startDate = startOfMonth(subMonths(now, 6));
          endDate = endOfMonth(now);
          break;
        case "year_to_date":
          startDate = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
          endDate = endOfMonth(now);
          break;
        default:
          throw new Error("Invalid period");
      }
    }

    // Get income
    const incomeResult = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.propertyId, propertyId),
          between(payments.transactionDate, startDate, endDate),
          eq(payments.status, "successful")
        )
      );

    // Get expenses
    const expensesResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.propertyId, propertyId),
          between(expenses.expenseDate, startDate, endDate)
        )
      );

    // Get occupancy rate
    const units = await db.query.units.findMany({
      where: eq(units.propertyId, propertyId),
    });

    let occupiedUnits = 0;
    for (const unit of units) {
      const activeLease = await db.query.leases.findFirst({
        where: and(eq(leases.unitId, unit.id), eq(leases.status, "active")),
      });

      if (activeLease) {
        occupiedUnits++;
      }
    }

    const occupancyRate =
      units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

    // Compile summary
    return {
      period: {
        startDate,
        endDate,
      },
      income: incomeResult[0]?.total || 0,
      expenses: expensesResult[0]?.total || 0,
      netIncome:
        (incomeResult[0]?.total || 0) - (expensesResult[0]?.total || 0),
      occupancyRate,
      totalUnits: units.length,
      occupiedUnits,
    };
  }

  /**
   * Get property expenses
   */
  async getPropertyExpenses(propertyId: string, ownerId: string) {
    // Verify owner has access to this property
    const propertyAccess = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, propertyId),
        eq(properties.ownerId, ownerId)
      ),
    });

    if (!propertyAccess) {
      throw new Error("Property not found or access denied");
    }

    // Get expenses with details
    return db.query.expenses.findMany({
      where: eq(expenses.propertyId, propertyId),
      orderBy: [desc(expenses.expenseDate)],
      with: {
        recorder: true,
      },
    });
  }
}

export const ownerPortalService = new OwnerPortalService();
