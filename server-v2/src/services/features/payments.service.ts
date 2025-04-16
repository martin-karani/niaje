// src/services/features/payments.service.ts
import { CURRENCY_CONFIG } from "@/config/environment";
import { db } from "@/db";
import {
  expenses,
  leases,
  organization,
  payments,
  properties,
  tenants,
  units,
  utilityBills,
} from "@/db/schema";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { and, between, desc, eq, sum } from "drizzle-orm";

export class PaymentsService {
  /**
   * Record a payment
   */
  async recordPayment(data: {
    organizationId: string;
    propertyId?: string;
    unitId?: string;
    leaseId?: string;
    tenantId?: string;
    type: string;
    method: string;
    amount: number;
    description?: string;
    notes?: string;
    referenceId?: string;
    transactionDate: Date;
    dueDate?: Date;
    recordedBy: string;
    currency?: string;
  }) {
    // Validate references if provided
    if (data.propertyId) {
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, data.propertyId),
      });

      if (!property || property.organizationId !== data.organizationId) {
        throw new Error("Property not found or not in this organization");
      }
    }

    if (data.unitId) {
      const unit = await db.query.units.findFirst({
        where: eq(units.id, data.unitId),
      });

      if (!unit) {
        throw new Error("Unit not found");
      }

      // If propertyId not provided, get it from unit
      if (!data.propertyId) {
        data.propertyId = unit.propertyId;
      }
    }

    if (data.leaseId) {
      const lease = await db.query.leases.findFirst({
        where: eq(leases.id, data.leaseId),
      });

      if (!lease) {
        throw new Error("Lease not found");
      }

      // If unitId or propertyId not provided, get them from lease
      if (!data.unitId) {
        data.unitId = lease.unitId;
      }
      if (!data.propertyId) {
        data.propertyId = lease.propertyId;
      }
    }

    if (data.tenantId) {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, data.tenantId),
      });

      if (!tenant) {
        throw new Error("Tenant not found");
      }
    }

    // Get organization details for currency
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
    });

    // Create payment record
    const result = await db
      .insert(payments)
      .values({
        organizationId: data.organizationId,
        propertyId: data.propertyId,
        unitId: data.unitId,
        leaseId: data.leaseId,
        tenantId: data.tenantId,
        type: data.type,
        method: data.method,
        amount: data.amount,
        status: "successful", // When manually recorded, we assume it's already successful
        currency:
          data.currency || org?.currency || CURRENCY_CONFIG.DEFAULT_CURRENCY,
        transactionDate: data.transactionDate || new Date(),
        dueDate: data.dueDate,
        paidDate: data.transactionDate || new Date(),
        description: data.description,
        notes: data.notes,
        referenceId: data.referenceId,
        recordedBy: data.recordedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Record an expense
   */
  async recordExpense(data: {
    organizationId: string;
    propertyId?: string;
    unitId?: string;
    category: string;
    amount: number;
    expenseDate: Date;
    description: string;
    vendor?: string;
    notes?: string;
    recordedBy: string;
    createPayment?: boolean; // Whether to create a payment record for this expense
  }) {
    // Validate references if provided
    if (data.propertyId) {
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, data.propertyId),
      });

      if (!property || property.organizationId !== data.organizationId) {
        throw new Error("Property not found or not in this organization");
      }
    }

    if (data.unitId) {
      const unit = await db.query.units.findFirst({
        where: eq(units.id, data.unitId),
      });

      if (!unit) {
        throw new Error("Unit not found");
      }

      // If propertyId not provided, get it from unit
      if (!data.propertyId) {
        data.propertyId = unit.propertyId;
      }
    }

    // Create expense record
    const expenseResult = await db
      .insert(expenses)
      .values({
        organizationId: data.organizationId,
        propertyId: data.propertyId,
        unitId: data.unitId,
        category: data.category,
        amount: data.amount,
        expenseDate: data.expenseDate,
        description: data.description,
        vendor: data.vendor,
        notes: data.notes,
        recordedBy: data.recordedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const expense = expenseResult[0];

    // If createPayment flag is true, create corresponding payment record
    if (data.createPayment) {
      const paymentResult = await db
        .insert(payments)
        .values({
          organizationId: data.organizationId,
          propertyId: data.propertyId,
          unitId: data.unitId,
          type: "expense_payment",
          method: "other", // Default method
          amount: data.amount,
          status: "successful",
          currency: CURRENCY_CONFIG.DEFAULT_CURRENCY,
          transactionDate: data.expenseDate,
          description: `Payment for: ${data.description}`,
          notes: data.notes,
          recordedBy: data.recordedBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Link payment to expense
      await db
        .update(expenses)
        .set({
          paymentId: paymentResult[0].id,
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, expense.id));

      expense.paymentId = paymentResult[0].id;
    }

    return expense;
  }

  /**
   * Create utility bill
   */
  async createUtilityBill(data: {
    organizationId: string;
    propertyId: string;
    unitId: string;
    leaseId?: string;
    tenantId?: string;
    utilityType: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    dueDate: Date;
    amount: number;
    meterReadingStart?: number;
    meterReadingEnd?: number;
    consumption?: number;
    rate?: number;
    notes?: string;
  }) {
    // Validate unit and property
    const unit = await db.query.units.findFirst({
      where: and(
        eq(units.id, data.unitId),
        eq(units.propertyId, data.propertyId)
      ),
    });

    if (!unit) {
      throw new Error("Unit not found or doesn't belong to specified property");
    }

    // Get active lease if leaseId not provided
    if (!data.leaseId) {
      const activeLease = await db.query.leases.findFirst({
        where: and(eq(leases.unitId, data.unitId), eq(leases.status, "active")),
      });

      if (activeLease) {
        data.leaseId = activeLease.id;
      }
    }

    // Get tenant if tenantId not provided but leaseId is
    if (!data.tenantId && data.leaseId) {
      const leaseTenant = await db.query.leaseTenants.findFirst({
        where: and(
          eq(leaseTenants.leaseId, data.leaseId),
          eq(leaseTenants.isPrimary, true)
        ),
        with: {
          tenant: true,
        },
      });

      if (leaseTenant) {
        data.tenantId = leaseTenant.tenantId;
      }
    }

    // Calculate consumption if not provided but readings are
    if (
      !data.consumption &&
      data.meterReadingStart !== undefined &&
      data.meterReadingEnd !== undefined
    ) {
      data.consumption = data.meterReadingEnd - data.meterReadingStart;
    }

    // Create utility bill
    const result = await db
      .insert(utilityBills)
      .values({
        organizationId: data.organizationId,
        propertyId: data.propertyId,
        unitId: data.unitId,
        leaseId: data.leaseId,
        tenantId: data.tenantId,
        utilityType: data.utilityType,
        billingPeriodStart: data.billingPeriodStart,
        billingPeriodEnd: data.billingPeriodEnd,
        dueDate: data.dueDate,
        amount: data.amount,
        status: "due",
        meterReadingStart: data.meterReadingStart,
        meterReadingEnd: data.meterReadingEnd,
        consumption: data.consumption,
        rate: data.rate,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Get financial summary for a property
   */
  async getPropertyFinancialSummary(
    propertyId: string,
    period: "month" | "quarter" | "year" | "custom",
    startDate?: Date,
    endDate?: Date
  ) {
    // Determine date range based on period
    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    if (period === "custom" && startDate && endDate) {
      periodStart = startDate;
      periodEnd = endDate;
    } else {
      periodEnd = endOfMonth(now);

      switch (period) {
        case "month":
          periodStart = startOfMonth(now);
          break;
        case "quarter":
          // Start 3 months ago
          periodStart = startOfMonth(
            new Date(now.getFullYear(), now.getMonth() - 3, 1)
          );
          break;
        case "year":
          // Start 12 months ago
          periodStart = startOfMonth(
            new Date(now.getFullYear(), now.getMonth() - 12, 1)
          );
          break;
        default:
          periodStart = startOfMonth(now);
      }
    }

    // Get income from payments
    const income = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.propertyId, propertyId),
          between(payments.transactionDate, periodStart, periodEnd),
          eq(payments.status, "successful"),
          notInArray(payments.type, ["expense_payment", "owner_payout"])
        )
      );

    // Get expenses
    const expenses = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.propertyId, propertyId),
          between(expenses.expenseDate, periodStart, periodEnd)
        )
      );

    // Get rent collection rate - payments marked as rent compared to expected rent from leases
    const rentPayments = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.propertyId, propertyId),
          between(payments.transactionDate, periodStart, periodEnd),
          eq(payments.status, "successful"),
          eq(payments.type, "rent")
        )
      );

    // Expected rent is more complex - would need to calculate based on active leases during the period
    // This is a simplified version
    const rentExpected = await calculateExpectedRent(
      propertyId,
      periodStart,
      periodEnd
    );

    const rentCollectionRate =
      rentExpected > 0
        ? ((rentPayments[0]?.total || 0) / rentExpected) * 100
        : 0;

    return {
      period: {
        start: format(periodStart, "yyyy-MM-dd"),
        end: format(periodEnd, "yyyy-MM-dd"),
      },
      income: income[0]?.total || 0,
      expenses: expenses[0]?.total || 0,
      netIncome: (income[0]?.total || 0) - (expenses[0]?.total || 0),
      rentCollectionRate,
      currency: CURRENCY_CONFIG.DEFAULT_CURRENCY,
    };
  }

  /**
   * Get payment history for a property
   */
  async getPropertyPaymentHistory(propertyId: string, limit = 50) {
    return db.query.payments.findMany({
      where: eq(payments.propertyId, propertyId),
      orderBy: [desc(payments.transactionDate)],
      limit,
      with: {
        tenant: true,
        lease: true,
        unit: true,
        recorder: true,
      },
    });
  }
}

/**
 * Calculate expected rent for a property over a time period
 * This is a simplified version - a full implementation would be more complex
 */
async function calculateExpectedRent(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Get all units in the property
  const propertyUnits = await db.query.units.findMany({
    where: eq(units.propertyId, propertyId),
  });

  let totalExpectedRent = 0;

  // For each unit, get active leases during the period
  for (const unit of propertyUnits) {
    const unitLeases = await db.query.leases.findMany({
      where: and(
        eq(leases.unitId, unit.id),
        or(
          // Lease was active at start of period
          and(
            lte(leases.startDate, startDate),
            or(gte(leases.endDate, startDate), eq(leases.status, "active"))
          ),
          // Lease started during period
          and(gte(leases.startDate, startDate), lte(leases.startDate, endDate))
        )
      ),
    });

    // Calculate expected rent from each lease
    for (const lease of unitLeases) {
      // Determine the overlap between lease period and analysis period
      const leaseStart = new Date(
        Math.max(lease.startDate.getTime(), startDate.getTime())
      );

      // For end date, use the earlier of lease end or analysis end
      let leaseEnd;
      if (
        lease.status === "active" &&
        (!lease.endDate || lease.endDate > endDate)
      ) {
        leaseEnd = endDate;
      } else {
        leaseEnd = new Date(
          Math.min(lease.endDate.getTime(), endDate.getTime())
        );
      }

      // Calculate number of months between leaseStart and leaseEnd
      const months =
        (leaseEnd.getFullYear() - leaseStart.getFullYear()) * 12 +
        leaseEnd.getMonth() -
        leaseStart.getMonth() +
        (leaseEnd.getDate() >= leaseStart.getDate() ? 0 : -1);

      // Add prorated rent for partial first month if needed
      let expectedRent = 0;

      if (months <= 0) {
        // Less than a month, calculate daily rate
        const daysInMonth = new Date(
          leaseStart.getFullYear(),
          leaseStart.getMonth() + 1,
          0
        ).getDate();
        const daysActive = Math.ceil(
          (leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        expectedRent = (lease.rentAmount / daysInMonth) * daysActive;
      } else {
        // Full months plus partial months
        expectedRent = lease.rentAmount * months;

        // Add prorated amount for partial first month
        if (leaseStart.getDate() > 1) {
          const daysInFirstMonth = new Date(
            leaseStart.getFullYear(),
            leaseStart.getMonth() + 1,
            0
          ).getDate();
          const daysActive = daysInFirstMonth - leaseStart.getDate() + 1;
          expectedRent += (lease.rentAmount / daysInFirstMonth) * daysActive;
        }

        // Add prorated amount for partial last month
        if (
          leaseEnd.getDate() <
          new Date(leaseEnd.getFullYear(), leaseEnd.getMonth() + 1, 0).getDate()
        ) {
          const daysInLastMonth = new Date(
            leaseEnd.getFullYear(),
            leaseEnd.getMonth() + 1,
            0
          ).getDate();
          expectedRent +=
            (lease.rentAmount / daysInLastMonth) * leaseEnd.getDate();
        }
      }

      totalExpectedRent += expectedRent;
    }
  }

  return totalExpectedRent;
}

export const paymentsService = new PaymentsService();
