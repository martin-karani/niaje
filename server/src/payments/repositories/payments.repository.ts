import { db } from "@/db";
import { leases, transactions, units, utilityBills } from "@/db/schema";
import { TransactionFilterDto } from "@/payments/dto/payments.dto";
import {
  Transaction,
  TransactionWithRelations,
  UtilityBill,
  UtilityBillWithRelations,
} from "@/payments/types";
import {
  and,
  between,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  sum,
} from "drizzle-orm";
import {
  CreateTransactionDto,
  CreateUtilityBillDto,
  UpdateTransactionDto,
  UpdateUtilityBillDto,
} from "../dto/payments.dto";

export class PaymentsRepository {
  /**
   * Find all transactions with optional filtering
   */
  async findAllTransactions(
    filters?: TransactionFilterDto
  ): Promise<TransactionWithRelations[]> {
    const conditions = [];

    if (filters?.leaseId) {
      conditions.push(eq(transactions.leaseId, filters.leaseId));
    }

    if (filters?.tenantId) {
      // This requires joining through leases
      // Use the inArray operator instead of eq with a subquery
      const tenantLeases = await db.query.leases.findMany({
        where: eq(leases.tenantId, filters.tenantId),
        columns: {
          id: true,
        },
      });

      const tenantLeaseIds = tenantLeases.map((lease) => lease.id);

      if (tenantLeaseIds.length > 0) {
        conditions.push(inArray(transactions.leaseId, tenantLeaseIds));
      } else {
        // If no leases are found for this tenant, return no results
        conditions.push(sql`false`); // This will ensure no results are returned
      }
    }

    if (filters?.propertyId) {
      // This requires joining through units and leases
      // First get all units for this property
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, filters.propertyId),
        columns: {
          id: true,
        },
      });

      const unitIds = propertyUnits.map((unit) => unit.id);

      if (unitIds.length > 0) {
        // Now get all leases for these units
        const leaseRecords = await db.query.leases.findMany({
          where: inArray(leases.unitId, unitIds),
          columns: {
            id: true,
          },
        });

        const leaseIds = leaseRecords.map((lease) => lease.id);

        if (leaseIds.length > 0) {
          conditions.push(inArray(transactions.leaseId, leaseIds));
        } else {
          // If no leases are found for these units, return no results
          conditions.push(sql`false`);
        }
      } else {
        // If no units are found for this property, return no results
        conditions.push(sql`false`);
      }
    }

    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters?.status) {
      conditions.push(eq(transactions.status, filters.status));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(transactions.paymentDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(transactions.paymentDate, filters.dateTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(transactions.notes || "", `%${filters.search}%`),
          ilike(transactions.category || "", `%${filters.search}%`)
        )
      );
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return db.query.transactions.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        lease: {
          columns: {
            id: true,
            unitId: true,
            tenantId: true,
          },
          with: {
            unit: {
              columns: {
                name: true,
              },
              with: {
                property: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            tenant: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        recorder: {
          columns: {
            id: true,
            name: true,
          },
          relationName: "transactionRecorder",
        },
      },
      orderBy: [desc(transactions.paymentDate)],
      limit,
      offset,
    });
  }

  /**
   * Count transactions with filters (for pagination)
   */
  async countTransactions(
    filters?: Omit<TransactionFilterDto, "page" | "limit">
  ): Promise<number> {
    const conditions = [];

    if (filters?.leaseId) {
      conditions.push(eq(transactions.leaseId, filters.leaseId));
    }

    if (filters?.tenantId) {
      const tenantLeases = await db.query.leases.findMany({
        where: eq(leases.tenantId, filters.tenantId),
        columns: {
          id: true,
        },
      });

      const tenantLeaseIds = tenantLeases.map((lease) => lease.id);

      if (tenantLeaseIds.length > 0) {
        conditions.push(inArray(transactions.leaseId, tenantLeaseIds));
      } else {
        conditions.push(sql`false`);
      }
    }

    if (filters?.propertyId) {
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, filters.propertyId),
        columns: {
          id: true,
        },
      });

      const unitIds = propertyUnits.map((unit) => unit.id);

      if (unitIds.length > 0) {
        const leaseRecords = await db.query.leases.findMany({
          where: inArray(leases.unitId, unitIds),
          columns: {
            id: true,
          },
        });

        const leaseIds = leaseRecords.map((lease) => lease.id);

        if (leaseIds.length > 0) {
          conditions.push(inArray(transactions.leaseId, leaseIds));
        } else {
          conditions.push(sql`false`);
        }
      } else {
        conditions.push(sql`false`);
      }
    }

    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters?.status) {
      conditions.push(eq(transactions.status, filters.status));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(transactions.paymentDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(transactions.paymentDate, filters.dateTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(transactions.notes || "", `%${filters.search}%`),
          ilike(transactions.category || "", `%${filters.search}%`)
        )
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(transactions)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a transaction by ID
   */
  async findTransactionById(
    id: string
  ): Promise<TransactionWithRelations | null> {
    return db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        lease: {
          columns: {
            id: true,
            unitId: true,
            tenantId: true,
          },
          with: {
            unit: {
              columns: {
                name: true,
              },
              with: {
                property: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            tenant: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        utilityBill: true,
        recorder: {
          columns: {
            id: true,
            name: true,
          },
          relationName: "transactionRecorder",
        },
      },
    });
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    transactionData: CreateTransactionDto & { recordedBy?: string }
  ): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...transactionData,
        updatedAt: new Date(),
      })
      .returning();

    return transaction;
  }

  /**
   * Update a transaction
   */
  async updateTransaction(
    id: string,
    transactionData: Partial<UpdateTransactionDto>
  ): Promise<Transaction> {
    // Remove id from the update data if present
    const { id: _, ...updateData } = transactionData;

    const [transaction] = await db
      .update(transactions)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();

    return transaction;
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  /**
   * Find all utility bills with optional filtering
   */
  async findAllUtilityBills(filters?: {
    leaseId?: string;
    propertyId?: string;
    tenantId?: string;
    utilityType?: string;
    isPaid?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<UtilityBillWithRelations[]> {
    const conditions = [];

    if (filters?.leaseId) {
      conditions.push(eq(utilityBills.leaseId, filters.leaseId));
    }

    if (filters?.tenantId) {
      const tenantLeases = await db.query.leases.findMany({
        where: eq(leases.tenantId, filters.tenantId),
        columns: {
          id: true,
        },
      });

      const tenantLeaseIds = tenantLeases.map((lease) => lease.id);

      if (tenantLeaseIds.length > 0) {
        conditions.push(inArray(utilityBills.leaseId, tenantLeaseIds));
      } else {
        conditions.push(sql`false`);
      }
    }

    if (filters?.propertyId) {
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, filters.propertyId),
        columns: {
          id: true,
        },
      });

      const unitIds = propertyUnits.map((unit) => unit.id);

      if (unitIds.length > 0) {
        const leaseRecords = await db.query.leases.findMany({
          where: inArray(leases.unitId, unitIds),
          columns: {
            id: true,
          },
        });

        const leaseIds = leaseRecords.map((lease) => lease.id);

        if (leaseIds.length > 0) {
          conditions.push(inArray(utilityBills.leaseId, leaseIds));
        } else {
          conditions.push(sql`false`);
        }
      } else {
        conditions.push(sql`false`);
      }
    }

    if (filters?.utilityType) {
      conditions.push(eq(utilityBills.utilityType, filters.utilityType));
    }

    if (filters?.isPaid !== undefined) {
      conditions.push(eq(utilityBills.isPaid, filters.isPaid));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(utilityBills.billDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(utilityBills.billDate, filters.dateTo));
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return db.query.utilityBills.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        lease: {
          columns: {
            id: true,
            unitId: true,
            tenantId: true,
          },
          with: {
            unit: {
              columns: {
                name: true,
              },
              with: {
                property: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            tenant: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [desc(utilityBills.dueDate)],
      limit,
      offset,
    });
  }

  /**
   * Count utility bills with filters (for pagination)
   */
  async countUtilityBills(
    filters?: Omit<
      {
        leaseId?: string;
        propertyId?: string;
        tenantId?: string;
        utilityType?: string;
        isPaid?: boolean;
        dateFrom?: Date;
        dateTo?: Date;
        page?: number;
        limit?: number;
      },
      "page" | "limit"
    >
  ): Promise<number> {
    const conditions: any[] = [];

    if (filters?.leaseId) {
      conditions.push(eq(utilityBills.leaseId, filters.leaseId));
    }

    if (filters?.tenantId) {
      const tenantLeases = await db.query.leases.findMany({
        where: eq(leases.tenantId, filters.tenantId),
        columns: {
          id: true,
        },
      });

      const tenantLeaseIds = tenantLeases.map((lease) => lease.id);

      if (tenantLeaseIds.length > 0) {
        conditions.push(inArray(utilityBills.leaseId, tenantLeaseIds));
      } else {
        conditions.push(sql`false`);
      }
    }

    if (filters?.propertyId) {
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, filters.propertyId),
        columns: {
          id: true,
        },
      });

      const unitIds = propertyUnits.map((unit) => unit.id);

      if (unitIds.length > 0) {
        const leaseRecords = await db.query.leases.findMany({
          where: inArray(leases.unitId, unitIds),
          columns: {
            id: true,
          },
        });

        const leaseIds = leaseRecords.map((lease) => lease.id);

        if (leaseIds.length > 0) {
          conditions.push(inArray(utilityBills.leaseId, leaseIds));
        } else {
          conditions.push(sql`false`);
        }
      } else {
        conditions.push(sql`false`);
      }
    }

    if (filters?.utilityType) {
      conditions.push(eq(utilityBills.utilityType, filters.utilityType));
    }

    if (filters?.isPaid !== undefined) {
      conditions.push(eq(utilityBills.isPaid, filters.isPaid));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(utilityBills.billDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(utilityBills.billDate, filters.dateTo));
    }

    const [result] = await db
      .select({ count: count() })
      .from(utilityBills)
      .where(conditions.length ? and(...conditions) : undefined);

    return result.count;
  }

  /**
   * Find a utility bill by ID
   */
  async findUtilityBillById(
    id: string
  ): Promise<UtilityBillWithRelations | null> {
    const utilityBill = await db.query.utilityBills.findFirst({
      where: eq(utilityBills.id, id),
      with: {
        lease: {
          columns: {
            id: true,
            unitId: true,
            tenantId: true,
          },
          with: {
            unit: {
              columns: {
                name: true,
              },
              with: {
                property: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            tenant: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!utilityBill) return null;

    // Find any related transaction
    const relatedTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.utilityBillId, id),
    });

    return {
      ...utilityBill,
      relatedTransaction: relatedTransaction || undefined,
    };
  }

  /**
   * Create a new utility bill
   */
  async createUtilityBill(
    billData: CreateUtilityBillDto
  ): Promise<UtilityBill> {
    const [bill] = await db
      .insert(utilityBills)
      .values({
        ...billData,
        updatedAt: new Date(),
      })
      .returning();

    return bill;
  }

  /**
   * Update a utility bill
   */
  async updateUtilityBill(
    id: string,
    billData: Partial<UpdateUtilityBillDto>
  ): Promise<UtilityBill> {
    // Remove id from the update data if present
    const { id: _, ...updateData } = billData;

    const [bill] = await db
      .update(utilityBills)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(utilityBills.id, id))
      .returning();

    return bill;
  }

  /**
   * Delete a utility bill
   */
  async deleteUtilityBill(id: string): Promise<void> {
    await db.delete(utilityBills).where(eq(utilityBills.id, id));
  }

  /**
   * Mark a utility bill as paid and create related transaction
   */
  async markUtilityBillPaid(
    id: string,
    paidDate: Date,
    paymentMethod?: string,
    notes?: string,
    recordedBy?: string
  ): Promise<{ bill: UtilityBill; transaction: Transaction }> {
    // Get the bill first
    const bill = await this.findUtilityBillById(id);
    if (!bill) {
      throw new Error("Utility bill not found");
    }

    // Update the bill
    const [updatedBill] = await db
      .update(utilityBills)
      .set({
        isPaid: true,
        paidDate,
        updatedAt: new Date(),
      })
      .where(eq(utilityBills.id, id))
      .returning();

    // Create a transaction for this payment
    const [transaction] = await db
      .insert(transactions)
      .values({
        leaseId: bill.leaseId,
        utilityBillId: id,
        amount: bill.tenantAmount,
        type: "utility",
        category: bill.utilityType,
        status: "completed",
        paymentMethod: paymentMethod || "bank_transfer",
        paymentDate: paidDate,
        dueDate: bill.dueDate,
        recordedBy,
        notes: notes || `Payment for ${bill.utilityType} bill`,
        updatedAt: new Date(),
      })
      .returning();

    return { bill: updatedBill, transaction };
  }

  /**
   * Get financial summary for a date range and property
   */
  async getFinancialSummary(
    dateFrom: Date,
    dateTo: Date,
    propertyId?: string
  ): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    outstandingRent: number;
    outstandingUtilities: number;
    revenueByType: { type: string; amount: number }[];
    revenueByProperty?: {
      propertyId: string;
      propertyName: string;
      amount: number;
    }[];
    revenueByMonth: { month: string; amount: number }[];
  }> {
    // Base conditions for queries
    const dateRangeCondition = between(
      transactions.paymentDate,
      dateFrom,
      dateTo
    );

    let propertyLeaseIds: string[] = [];

    if (propertyId) {
      // First get all units for this property
      const propertyUnits = await db.query.units.findMany({
        where: eq(units.propertyId, propertyId),
        columns: {
          id: true,
        },
      });

      const unitIds = propertyUnits.map((unit) => unit.id);

      if (unitIds.length > 0) {
        // Now get all leases for these units
        const leaseRecords = await db.query.leases.findMany({
          where: inArray(leases.unitId, unitIds),
          columns: {
            id: true,
          },
        });

        propertyLeaseIds = leaseRecords.map((lease) => lease.id);
      }
    }

    // Calculate total revenue
    const revenueTypes = ["rent", "deposit", "fee"];
    let revenueConditions = [
      dateRangeCondition,
      eq(transactions.status, "completed"),
      or(...revenueTypes.map((type) => eq(transactions.type, type))),
    ];

    if (propertyId && propertyLeaseIds.length > 0) {
      revenueConditions.push(inArray(transactions.leaseId, propertyLeaseIds));
    } else if (propertyId) {
      // If property has no leases, return zero for all calculations
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        outstandingRent: 0,
        outstandingUtilities: 0,
        revenueByType: [],
        revenueByProperty: propertyId ? undefined : [],
        revenueByMonth: [],
      };
    }

    const [totalRevenueResult] = await db
      .select({ sum: sum(transactions.amount) })
      .from(transactions)
      .where(and(...revenueConditions));

    // Calculate total expenses (refunds, landlord's utility bills, etc.)
    const expenseTypes = ["refund"];
    let expenseConditions = [
      dateRangeCondition,
      eq(transactions.status, "completed"),
      or(...expenseTypes.map((type) => eq(transactions.type, type))),
    ];

    if (propertyId && propertyLeaseIds.length > 0) {
      expenseConditions.push(inArray(transactions.leaseId, propertyLeaseIds));
    }

    const [totalExpensesResult] = await db
      .select({ sum: sum(transactions.amount) })
      .from(transactions)
      .where(and(...expenseConditions));

    // Calculate outstanding rent
    // This requires more complex logic to get active leases and check due dates
    // Simplified version:
    let rentConditions = [
      eq(transactions.type, "rent"),
      eq(transactions.status, "pending"),
      lte(transactions.dueDate, new Date()),
    ];

    if (propertyId && propertyLeaseIds.length > 0) {
      rentConditions.push(inArray(transactions.leaseId, propertyLeaseIds));
    }

    const [outstandingRentResult] = await db
      .select({ sum: sum(transactions.amount) })
      .from(transactions)
      .where(and(...rentConditions));

    // Calculate outstanding utility bills
    let utilityConditions = [
      eq(utilityBills.isPaid, false),
      lte(utilityBills.dueDate, new Date()),
    ];

    if (propertyId && propertyLeaseIds.length > 0) {
      utilityConditions.push(inArray(utilityBills.leaseId, propertyLeaseIds));
    }

    const [outstandingUtilitiesResult] = await db
      .select({ sum: sum(utilityBills.tenantAmount) })
      .from(utilityBills)
      .where(and(...utilityConditions));

    // Get revenue by type
    let typeConditions = [
      dateRangeCondition,
      eq(transactions.status, "completed"),
    ];

    if (propertyId && propertyLeaseIds.length > 0) {
      typeConditions.push(inArray(transactions.leaseId, propertyLeaseIds));
    }

    const revenueByTypeResult = await db
      .select({
        type: transactions.type,
        amount: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(...typeConditions))
      .groupBy(transactions.type);

    // Get revenue by property - only if not filtered by property
    let revenueByPropertyResult: {
      propertyId: string;
      propertyName: string;
      amount: number;
    }[] = [];

    if (!propertyId) {
      // This needs a complex SQL query with joins
      // For simplicity, I'll use a direct SQL query here
      const propertyRevenueRows = await db.execute(sql`
        WITH active_properties AS (
          SELECT DISTINCT p.id, p.name
          FROM properties p
          JOIN units u ON u.property_id = p.id
          JOIN leases l ON l.unit_id = u.id
          JOIN transactions t ON t.lease_id = l.id
          WHERE t.payment_date BETWEEN ${dateFrom} AND ${dateTo}
          AND t.status = 'completed'
          AND (t.type = 'rent' OR t.type = 'deposit' OR t.type = 'fee')
        ),
        property_revenue AS (
          SELECT 
            p.id AS "propertyId",
            p.name AS "propertyName",
            SUM(t.amount) AS amount
          FROM properties p
          JOIN units u ON u.property_id = p.id
          JOIN leases l ON l.unit_id = u.id
          JOIN transactions t ON t.lease_id = l.id
          WHERE t.payment_date BETWEEN ${dateFrom} AND ${dateTo}
          AND t.status = 'completed'
          AND (t.type = 'rent' OR t.type = 'deposit' OR t.type = 'fee')
          GROUP BY p.id, p.name
        )
        SELECT * FROM property_revenue
        ORDER BY amount DESC
      `);

      revenueByPropertyResult = propertyRevenueRows;
    }

    // Get revenue by month
    let monthConditions = [
      dateRangeCondition,
      eq(transactions.status, "completed"),
      or(...revenueTypes.map((type) => eq(transactions.type, type))),
    ];

    if (propertyId && propertyLeaseIds.length > 0) {
      monthConditions.push(inArray(transactions.leaseId, propertyLeaseIds));
    }

    const revenueByMonthResult = await db.execute(sql`
      SELECT 
        TO_CHAR(payment_date, 'YYYY-MM') as month,
        SUM(amount) as amount
      FROM transactions
      WHERE payment_date BETWEEN ${dateFrom} AND ${dateTo}
      AND status = 'completed'
      AND (type = 'rent' OR type = 'deposit' OR type = 'fee')
      ${
        propertyId && propertyLeaseIds.length > 0
          ? sql`AND lease_id IN (${sql.join(propertyLeaseIds)})`
          : sql``
      }
      GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
      ORDER BY month
    `);

    return {
      totalRevenue: Number(totalRevenueResult.sum) || 0,
      totalExpenses: Number(totalExpensesResult.sum) || 0,
      netIncome:
        (Number(totalRevenueResult.sum) || 0) -
        (Number(totalExpensesResult.sum) || 0),
      outstandingRent: Number(outstandingRentResult.sum) || 0,
      outstandingUtilities: Number(outstandingUtilitiesResult.sum) || 0,
      revenueByType: revenueByTypeResult.map((r) => ({
        type: r.type,
        amount: Number(r.amount) || 0,
      })),
      revenueByProperty: !propertyId
        ? revenueByPropertyResult.map((r) => ({
            propertyId: r.propertyId,
            propertyName: r.propertyName,
            amount: Number(r.amount) || 0,
          }))
        : undefined,
      revenueByMonth: revenueByMonthResult.map((r) => ({
        month: r.month,
        amount: Number(r.amount) || 0,
      })),
    };
  }
}

// Export a singleton instance
export const paymentsRepository = new PaymentsRepository();
