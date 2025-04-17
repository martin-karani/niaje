// src/domains/billing/services/expenses.service.ts
import { db } from "@infrastructure/database";
import { AuthorizationError } from "@shared/errors/authorization.error";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { CreateExpenseDto, UpdateExpenseDto } from "../dto/expense.dto";
import { Expense, expenseEntity, NewExpense } from "../entities/expense.entity";
import { NewPayment, paymentEntity } from "../entities/payment.entity";

export class ExpensesService {
  /**
   * Get all expenses for an organization
   */
  async getExpensesByOrganization(organizationId: string): Promise<Expense[]> {
    return db.query.expenseEntity.findMany({
      where: eq(expenseEntity.organizationId, organizationId),
      orderBy: [desc(expenseEntity.expenseDate)],
      with: {
        property: true,
        unit: true,
        recorder: true,
        payment: true,
      },
    });
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<Expense | undefined> {
    return db.query.expenseEntity.findFirst({
      where: eq(expenseEntity.id, id),
      with: {
        property: true,
        unit: true,
        recorder: true,
        payment: true,
      },
    });
  }

  /**
   * Get expenses by property
   */
  async getExpensesByProperty(
    propertyId: string,
    organizationId: string
  ): Promise<Expense[]> {
    return db.query.expenseEntity.findMany({
      where: and(
        eq(expenseEntity.propertyId, propertyId),
        eq(expenseEntity.organizationId, organizationId)
      ),
      orderBy: [desc(expenseEntity.expenseDate)],
      with: {
        unit: true,
        recorder: true,
        payment: true,
      },
    });
  }

  /**
   * Create a new expense
   */
  async createExpense(
    data: CreateExpenseDto,
    organizationId: string,
    recordedBy: string,
    createPayment: boolean = false
  ): Promise<Expense> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      let paymentId: string | null = null;

      // If we should create a corresponding payment record
      if (createPayment) {
        const paymentData: NewPayment = {
          organizationId,
          propertyId: data.propertyId,
          unitId: data.unitId,
          type: "expense_reimbursement",
          status: "successful",
          method: "other", // Default method, can be updated later
          amount: data.amount,
          currency: "KES", // Default currency, can be made configurable
          transactionDate: new Date(data.expenseDate),
          description: data.description,
          notes: data.notes || null,
          recordedBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const paymentResult = await tx
          .insert(paymentEntity)
          .values(paymentData)
          .returning();
        paymentId = paymentResult[0].id;
      }

      const newExpense: NewExpense = {
        ...data,
        organizationId,
        expenseDate: new Date(data.expenseDate),
        paymentId,
        recordedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await tx
        .insert(expenseEntity)
        .values(newExpense)
        .returning();
      return result[0];
    });
  }

  /**
   * Update an expense
   */
  async updateExpense(
    data: UpdateExpenseDto,
    organizationId: string
  ): Promise<Expense> {
    const expense = await this.getExpenseById(data.id);

    if (!expense) {
      throw new Error("Expense not found");
    }

    if (expense.organizationId !== organizationId) {
      throw new AuthorizationError(
        "You don't have permission to update this expense"
      );
    }

    const updateData: Partial<NewExpense> = {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
      updatedAt: new Date(),
    };

    const result = await db
      .update(expenseEntity)
      .set(updateData)
      .where(eq(expenseEntity.id, data.id))
      .returning();

    return result[0];
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id: string, organizationId: string): Promise<boolean> {
    const expense = await this.getExpenseById(id);

    if (!expense) {
      throw new Error("Expense not found");
    }

    if (expense.organizationId !== organizationId) {
      throw new AuthorizationError(
        "You don't have permission to delete this expense"
      );
    }

    // If there's a linked payment, we should delete that too
    return await db.transaction(async (tx) => {
      if (expense.paymentId) {
        await tx
          .delete(paymentEntity)
          .where(eq(paymentEntity.id, expense.paymentId));
      }

      await tx.delete(expenseEntity).where(eq(expenseEntity.id, id));
      return true;
    });
  }

  /**
   * Get expenses for a property within a date range
   * Used for financial summaries
   */
  async getPropertyExpenses(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    organizationId: string
  ): Promise<number> {
    const expenses = await db.query.expenseEntity.findMany({
      where: and(
        eq(expenseEntity.propertyId, propertyId),
        eq(expenseEntity.organizationId, organizationId),
        gte(expenseEntity.expenseDate, startDate),
        lte(expenseEntity.expenseDate, endDate)
      ),
    });

    return expenses.reduce((sum, expense) => {
      // Assuming amount is stored as a string in the database
      return sum + parseFloat(expense.amount.toString());
    }, 0);
  }
}

// Export singleton instance
export const expensesService = new ExpensesService();
