// src/services/features/reports.service.ts
import { CURRENCY_CONFIG } from "@/config/environment";
import { db } from "@/db";
import {
  expenses,
  leases,
  maintenanceRequests,
  payments,
  properties,
  units,
} from "@/db/schema";
import { differenceInDays, endOfMonth, format, startOfMonth } from "date-fns";
import { and, between, eq, sum } from "drizzle-orm";

export class ReportsService {
  /**
   * Generate financial summary report
   */
  async generateFinancialSummary(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    propertyId?: string
  ) {
    // Base filter is by organization
    let propertyFilter = eq(properties.organizationId, organizationId);

    // Add property filter if provided
    if (propertyId) {
      propertyFilter = and(propertyFilter, eq(properties.id, propertyId));
    }

    // Get all properties matching the filter
    const matchingProperties = await db.query.properties.findMany({
      where: propertyFilter,
    });

    const propertyIds = matchingProperties.map((p) => p.id);

    // Get income from payments
    const incomeResult = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          inArray(payments.propertyId, propertyIds),
          between(payments.transactionDate, periodStart, periodEnd),
          eq(payments.status, "successful"),
          notInArray(payments.type, ["expense_payment", "owner_payout"])
        )
      );

    // Get expenses
    const expensesResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          inArray(expenses.propertyId, propertyIds),
          between(expenses.expenseDate, periodStart, periodEnd)
        )
      );

    // Get income breakdown by category
    const incomeCategories = [
      "rent",
      "deposit",
      "late_fee",
      "utility",
      "other_income",
    ];
    const incomeBreakdown = [];

    for (const category of incomeCategories) {
      const result = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            inArray(payments.propertyId, propertyIds),
            between(payments.transactionDate, periodStart, periodEnd),
            eq(payments.status, "successful"),
            eq(payments.type, category)
          )
        );

      incomeBreakdown.push({
        category,
        amount: result[0]?.total || 0,
      });
    }

    // Get expense breakdown by category
    const expenseCategories = [
      "maintenance_repair",
      "utilities",
      "property_tax",
      "insurance",
      "management_fee",
      "advertising",
      "supplies",
      "capital_improvement",
      "other",
    ];
    const expenseBreakdown = [];

    for (const category of expenseCategories) {
      const result = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(
          and(
            inArray(expenses.propertyId, propertyIds),
            between(expenses.expenseDate, periodStart, periodEnd),
            eq(expenses.category, category)
          )
        );

      expenseBreakdown.push({
        category,
        amount: result[0]?.total || 0,
      });
    }

    // Get monthly breakdown
    const monthlyData = [];
    let currentMonth = new Date(periodStart);

    while (currentMonth <= periodEnd) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Get income for this month
      const monthIncome = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            inArray(payments.propertyId, propertyIds),
            between(payments.transactionDate, monthStart, monthEnd),
            eq(payments.status, "successful"),
            notInArray(payments.type, ["expense_payment", "owner_payout"])
          )
        );

      // Get expenses for this month
      const monthExpenses = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(
          and(
            inArray(expenses.propertyId, propertyIds),
            between(expenses.expenseDate, monthStart, monthEnd)
          )
        );

      monthlyData.push({
        month: format(monthStart, "MMM yyyy"),
        income: monthIncome[0]?.total || 0,
        expenses: monthExpenses[0]?.total || 0,
        netIncome:
          (monthIncome[0]?.total || 0) - (monthExpenses[0]?.total || 0),
      });

      // Move to next month
      currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      );
    }

    // Get occupancy rate
    const allUnits = await db.query.units.findMany({
      where: inArray(units.propertyId, propertyIds),
    });

    let occupiedUnits = 0;
    for (const unit of allUnits) {
      const activeLease = await db.query.leases.findFirst({
        where: and(eq(leases.unitId, unit.id), eq(leases.status, "active")),
      });

      if (activeLease) {
        occupiedUnits++;
      }
    }

    const occupancyRate =
      allUnits.length > 0 ? (occupiedUnits / allUnits.length) * 100 : 0;

    // Return the report
    return {
      period: {
        start: format(periodStart, "yyyy-MM-dd"),
        end: format(periodEnd, "yyyy-MM-dd"),
      },
      summary: {
        income: incomeResult[0]?.total || 0,
        expenses: expensesResult[0]?.total || 0,
        netIncome:
          (incomeResult[0]?.total || 0) - (expensesResult[0]?.total || 0),
        currency: CURRENCY_CONFIG.DEFAULT_CURRENCY,
      },
      incomeBreakdown,
      expenseBreakdown,
      monthlyData,
      occupancy: {
        totalUnits: allUnits.length,
        occupiedUnits,
        occupancyRate,
      },
      properties: matchingProperties.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };
  }

  /**
   * Generate maintenance report
   */
  async generateMaintenanceReport(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    propertyId?: string
  ) {
    // Base filter is by organization
    let propertyFilter = eq(properties.organizationId, organizationId);

    // Add property filter if provided
    if (propertyId) {
      propertyFilter = and(propertyFilter, eq(properties.id, propertyId));
    }

    // Get all properties matching the filter
    const matchingProperties = await db.query.properties.findMany({
      where: propertyFilter,
    });

    const propertyIds = matchingProperties.map((p) => p.id);

    // Get maintenance requests within period
    const requests = await db.query.maintenanceRequests.findMany({
      where: and(
        inArray(maintenanceRequests.propertyId, propertyIds),
        between(maintenanceRequests.createdAt, periodStart, periodEnd)
      ),
      with: {
        property: true,
        unit: true,
        reporter: true,
        assignee: true,
      },
    });

    // Calculate total counts
    const totalRequests = requests.length;
    const completedRequests = requests.filter(
      (r) => r.status === "completed"
    ).length;
    const openRequests = requests.filter((r) =>
      ["reported", "scheduled", "in_progress"].includes(r.status)
    ).length;

    // Calculate resolution time for completed requests
    let totalResolutionDays = 0;
    let requestsWithResolutionTime = 0;

    for (const request of requests) {
      if (request.status === "completed" && request.completedDate) {
        const resolutionDays = differenceInDays(
          new Date(request.completedDate),
          new Date(request.createdAt)
        );
        totalResolutionDays += resolutionDays;
        requestsWithResolutionTime++;
      }
    }

    const avgResolutionDays =
      requestsWithResolutionTime > 0
        ? totalResolutionDays / requestsWithResolutionTime
        : 0;

    // Calculate total costs
    let totalCost = 0;
    let requestsWithCost = 0;

    for (const request of requests) {
      if (request.actualCost) {
        totalCost += request.actualCost;
        requestsWithCost++;
      }
    }

    const avgCost = requestsWithCost > 0 ? totalCost / requestsWithCost : 0;

    // Group by priority
    const priorityCounts = {};
    for (const request of requests) {
      priorityCounts[request.priority] =
        (priorityCounts[request.priority] || 0) + 1;
    }

    const priorityBreakdown = Object.entries(priorityCounts).map(
      ([priority, count]) => ({
        priority,
        count,
      })
    );

    // Group by category
    const categoryCounts = {};
    for (const request of requests) {
      if (request.category) {
        categoryCounts[request.category] =
          (categoryCounts[request.category] || 0) + 1;
      }
    }

    const categoryBreakdown = Object.entries(categoryCounts).map(
      ([category, count]) => ({
        category,
        count,
      })
    );

    // Group by property
    const propertyBreakdown = [];
    for (const property of matchingProperties) {
      const propertyRequests = requests.filter(
        (r) => r.propertyId === property.id
      );

      propertyBreakdown.push({
        propertyId: property.id,
        propertyName: property.name,
        count: propertyRequests.length,
        completed: propertyRequests.filter((r) => r.status === "completed")
          .length,
        totalCost: propertyRequests.reduce(
          (sum, r) => sum + (r.actualCost || 0),
          0
        ),
      });
    }

    // Return the report
    return {
      period: {
        start: format(periodStart, "yyyy-MM-dd"),
        end: format(periodEnd, "yyyy-MM-dd"),
      },
      summary: {
        totalRequests,
        completedRequests,
        openRequests,
        completionRate:
          totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
        avgResolutionDays,
        totalCost,
        avgCost,
        currency: CURRENCY_CONFIG.DEFAULT_CURRENCY,
      },
      priorityBreakdown,
      categoryBreakdown,
      propertyBreakdown,
      requests: requests.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        priority: r.priority,
        category: r.category,
        createdAt: format(r.createdAt, "yyyy-MM-dd"),
        completedDate: r.completedDate
          ? format(r.completedDate, "yyyy-MM-dd")
          : null,
        actualCost: r.actualCost,
        propertyName: r.property.name,
        unitName: r.unit?.name,
        reporterName: r.reporter?.name,
        assigneeName: r.assignee?.name,
      })),
    };
  }

  /**
   * Generate tenant report
   */
  async generateTenantReport(organizationId: string, propertyId?: string) {
    // Base filter is by organization
    let propertyFilter = eq(properties.organizationId, organizationId);

    // Add property filter if provided
    if (propertyId) {
      propertyFilter = and(propertyFilter, eq(properties.id, propertyId));
    }

    // Get all properties matching the filter
    const matchingProperties = await db.query.properties.findMany({
      where: propertyFilter,
      with: {
        units: true,
      },
    });

    const propertyIds = matchingProperties.map((p) => p.id);
    const unitIds = matchingProperties.flatMap((p) => p.units.map((u) => u.id));

    // Get all active leases
    const activeLeases = await db.query.leases.findMany({
      where: and(inArray(leases.unitId, unitIds), eq(leases.status, "active")),
      with: {
        tenantAssignments: {
          with: {
            tenant: true,
          },
        },
        unit: {
          with: {
            property: true,
          },
        },
      },
    });

    // Extract unique tenants
    const tenantMap = new Map();
    for (const lease of activeLeases) {
      for (const ta of lease.tenantAssignments) {
        if (!tenantMap.has(ta.tenant.id)) {
          tenantMap.set(ta.tenant.id, {
            ...ta.tenant,
            leases: [],
            totalRent: 0,
            properties: new Set(),
            maintenanceRequests: 0,
          });
        }

        const tenantData = tenantMap.get(ta.tenant.id);
        tenantData.leases.push({
          id: lease.id,
          unitName: lease.unit.name,
          propertyName: lease.unit.property.name,
          startDate: format(lease.startDate, "yyyy-MM-dd"),
          endDate: format(lease.endDate, "yyyy-MM-dd"),
          rentAmount: lease.rentAmount,
          isPrimary: ta.isPrimary,
        });

        tenantData.totalRent += lease.rentAmount;
        tenantData.properties.add(lease.unit.property.id);
      }
    }

    // Get maintenance requests counts for each tenant
    for (const [tenantId, tenantData] of tenantMap.entries()) {
      // Find user account for this tenant if exists
      if (tenantData.userId) {
        const requestCount = await db.query.maintenanceRequests
          .findMany({
            where: and(
              inArray(maintenanceRequests.propertyId, [
                ...tenantData.properties,
              ]),
              eq(maintenanceRequests.reportedBy, tenantData.userId)
            ),
          })
          .then((results) => results.length);

        tenantData.maintenanceRequests = requestCount;
      }

      // Convert properties Set to count
      tenantData.propertyCount = tenantData.properties.size;
      delete tenantData.properties; // Remove the Set before serializing
    }

    // Sort tenants by total rent (highest first)
    const sortedTenants = Array.from(tenantMap.values()).sort(
      (a, b) => b.totalRent - a.totalRent
    );

    // Return the report
    return {
      totalTenants: sortedTenants.length,
      tenants: sortedTenants.map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        email: t.email,
        phone: t.phone,
        status: t.status,
        leaseCount: t.leases.length,
        totalRent: t.totalRent,
        propertyCount: t.propertyCount,
        maintenanceRequests: t.maintenanceRequests,
        leases: t.leases,
      })),
    };
  }
}

export const reportsService = new ReportsService();
