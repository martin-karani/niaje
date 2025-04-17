// src/domains/billing/services/payments.service.ts
import { db } from "@infrastructure/database";
import { AuthorizationError } from "@shared/errors/authorization.error";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { CreatePaymentDto, UpdatePaymentDto } from "../dto/payment.dto";
import { NewPayment, Payment, paymentEntity } from "../entities/payment.entity";

export class PaymentsService {
  /**
   * Get all payments for an organization
   */
  async getPaymentsByOrganization(organizationId: string): Promise<Payment[]> {
    return db.query.paymentEntity.findMany({
      where: eq(paymentEntity.organizationId, organizationId),
      orderBy: [desc(paymentEntity.transactionDate)],
      with: {
        property: true,
        unit: true,
        lease: true,
        tenant: true,
        recorder: true,
      },
    });
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment | undefined> {
    return db.query.paymentEntity.findFirst({
      where: eq(paymentEntity.id, id),
      with: {
        property: true,
        unit: true,
        lease: true,
        tenant: true,
        recorder: true,
        utilityBill: true,
        expense: true,
      },
    });
  }

  /**
   * Get payments by property
   */
  async getPaymentsByProperty(
    propertyId: string,
    organizationId: string
  ): Promise<Payment[]> {
    return db.query.paymentEntity.findMany({
      where: and(
        eq(paymentEntity.propertyId, propertyId),
        eq(paymentEntity.organizationId, organizationId)
      ),
      orderBy: [desc(paymentEntity.transactionDate)],
      with: {
        unit: true,
        lease: true,
        tenant: true,
        recorder: true,
      },
    });
  }

  /**
   * Get payments by lease
   */
  async getPaymentsByLease(
    leaseId: string,
    organizationId: string
  ): Promise<Payment[]> {
    return db.query.paymentEntity.findMany({
      where: and(
        eq(paymentEntity.leaseId, leaseId),
        eq(paymentEntity.organizationId, organizationId)
      ),
      orderBy: [desc(paymentEntity.transactionDate)],
      with: {
        property: true,
        unit: true,
        tenant: true,
        recorder: true,
      },
    });
  }

  /**
   * Get payments by tenant
   */
  async getPaymentsByTenant(
    tenantId: string,
    organizationId: string
  ): Promise<Payment[]> {
    return db.query.paymentEntity.findMany({
      where: and(
        eq(paymentEntity.tenantId, tenantId),
        eq(paymentEntity.organizationId, organizationId)
      ),
      orderBy: [desc(paymentEntity.transactionDate)],
      with: {
        property: true,
        unit: true,
        lease: true,
        recorder: true,
      },
    });
  }

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const newPayment: NewPayment = {
      ...data,
      status: "pending",
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paidDate: data.paidDate ? new Date(data.paidDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .insert(paymentEntity)
      .values(newPayment)
      .returning();
    return result[0];
  }

  /**
   * Update a payment
   */
  async updatePayment(
    data: UpdatePaymentDto,
    organizationId: string
  ): Promise<Payment> {
    const payment = await this.getPaymentById(data.id);

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.organizationId !== organizationId) {
      throw new AuthorizationError(
        "You don't have permission to update this payment"
      );
    }

    const updateData: Partial<NewPayment> = {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
      updatedAt: new Date(),
    };

    const result = await db
      .update(paymentEntity)
      .set(updateData)
      .where(eq(paymentEntity.id, data.id))
      .returning();

    return result[0];
  }

  /**
   * Delete a payment
   */
  async deletePayment(id: string, organizationId: string): Promise<boolean> {
    const payment = await this.getPaymentById(id);

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.organizationId !== organizationId) {
      throw new AuthorizationError(
        "You don't have permission to delete this payment"
      );
    }

    await db.delete(paymentEntity).where(eq(paymentEntity.id, id));
    return true;
  }

  /**
   * Get income for a property within a date range
   * Used for financial summaries
   */
  async getPropertyIncome(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    organizationId: string
  ): Promise<number> {
    const payments = await db.query.paymentEntity.findMany({
      where: and(
        eq(paymentEntity.propertyId, propertyId),
        eq(paymentEntity.organizationId, organizationId),
        eq(paymentEntity.status, "successful"),
        gte(paymentEntity.transactionDate, startDate),
        lte(paymentEntity.transactionDate, endDate)
        // Income types only (rent, deposit, late_fee, utility, other_income)
      ),
    });

    return payments.reduce((sum, payment) => {
      // Assuming amount is stored as a string in the database
      return sum + parseFloat(payment.amount.toString());
    }, 0);
  }
}

// Export singleton instance
export const paymentsService = new PaymentsService();
