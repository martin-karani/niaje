import { db } from "@/infrastructure/database";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { and, desc, eq } from "drizzle-orm";
import {
  CreateUtilityBillDto,
  PayUtilityBillDto,
  UpdateUtilityBillDto,
} from "../dto/utility-bill.dto";
import { NewPayment, paymentEntity } from "../entities/payment.entity";
import {
  NewUtilityBill,
  UtilityBill,
  utilityBillEntity,
} from "../entities/utility-bill.entity";

export class UtilityBillsService {
  /**
   * Get all utility bills for an organization
   */
  async getUtilityBillsByOrganization(
    organizationId: string
  ): Promise<UtilityBill[]> {
    return db.query.utilityBillEntity.findMany({
      where: eq(utilityBillEntity.organizationId, organizationId),
      orderBy: [desc(utilityBillEntity.dueDate)],
      with: {
        property: true,
        unit: true,
        lease: true,
        tenant: true,
        payment: true,
      },
    });
  }

  /**
   * Get utility bill by ID
   */
  async getUtilityBillById(id: string): Promise<UtilityBill | undefined> {
    return db.query.utilityBillEntity.findFirst({
      where: eq(utilityBillEntity.id, id),
      with: {
        property: true,
        unit: true,
        lease: true,
        tenant: true,
        payment: true,
      },
    });
  }

  /**
   * Get utility bills by property
   */
  async getUtilityBillsByProperty(
    propertyId: string,
    organizationId: string
  ): Promise<UtilityBill[]> {
    return db.query.utilityBillEntity.findMany({
      where: and(
        eq(utilityBillEntity.propertyId, propertyId),
        eq(utilityBillEntity.organizationId, organizationId)
      ),
      orderBy: [desc(utilityBillEntity.dueDate)],
      with: {
        unit: true,
        lease: true,
        tenant: true,
        payment: true,
      },
    });
  }

  /**
   * Get utility bills by unit
   */
  async getUtilityBillsByUnit(
    unitId: string,
    organizationId: string
  ): Promise<UtilityBill[]> {
    return db.query.utilityBillEntity.findMany({
      where: and(
        eq(utilityBillEntity.unitId, unitId),
        eq(utilityBillEntity.organizationId, organizationId)
      ),
      orderBy: [desc(utilityBillEntity.dueDate)],
      with: {
        property: true,
        lease: true,
        tenant: true,
        payment: true,
      },
    });
  }

  /**
   * Create a new utility bill
   */
  async createUtilityBill(data: CreateUtilityBillDto): Promise<UtilityBill> {
    const newUtilityBill: NewUtilityBill = {
      ...data,
      billingPeriodStart: new Date(data.billingPeriodStart),
      billingPeriodEnd: new Date(data.billingPeriodEnd),
      dueDate: new Date(data.dueDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .insert(utilityBillEntity)
      .values(newUtilityBill)
      .returning();
    return result[0];
  }

  /**
   * Update a utility bill
   */
  async updateUtilityBill(
    data: UpdateUtilityBillDto,
    organizationId: string
  ): Promise<UtilityBill> {
    const utilityBill = await this.getUtilityBillById(data.id);

    if (!utilityBill) {
      throw new Error("Utility bill not found");
    }

    if (utilityBill.organizationId !== organizationId) {
      throw new AuthorizationError(
        "You don't have permission to update this utility bill"
      );
    }

    const updateData: Partial<NewUtilityBill> = {
      ...data,
      billingPeriodStart: data.billingPeriodStart
        ? new Date(data.billingPeriodStart)
        : undefined,
      billingPeriodEnd: data.billingPeriodEnd
        ? new Date(data.billingPeriodEnd)
        : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      updatedAt: new Date(),
    };

    const result = await db
      .update(utilityBillEntity)
      .set(updateData)
      .where(eq(utilityBillEntity.id, data.id))
      .returning();

    return result[0];
  }

  /**
   * Delete a utility bill
   */
  async deleteUtilityBill(
    id: string,
    organizationId: string
  ): Promise<boolean> {
    const utilityBill = await this.getUtilityBillById(id);

    if (!utilityBill) {
      throw new Error("Utility bill not found");
    }

    if (utilityBill.organizationId !== organizationId) {
      throw new AuthorizationError(
        "You don't have permission to delete this utility bill"
      );
    }

    // If there's a linked payment, we should delete that too
    return await db.transaction(async (tx) => {
      if (utilityBill.paymentId) {
        await tx
          .delete(paymentEntity)
          .where(eq(paymentEntity.id, utilityBill.paymentId));
      }

      await tx.delete(utilityBillEntity).where(eq(utilityBillEntity.id, id));
      return true;
    });
  }

  /**
   * Record payment for a utility bill
   */
  async payUtilityBill(
    data: PayUtilityBillDto,
    organizationId: string,
    recordedBy: string
  ): Promise<UtilityBill> {
    // Get the utility bill
    const utilityBill = await this.getUtilityBillById(data.id);

    if (!utilityBill) {
      throw new Error("Utility bill not found");
    }

    if (utilityBill.organizationId !== organizationId) {
      throw new AuthorizationError(
        "You don't have permission to pay this utility bill"
      );
    }

    // If it's already paid, throw an error
    if (utilityBill.status === "paid" && utilityBill.paymentId) {
      throw new Error("This utility bill is already paid");
    }

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create a payment record
      const paymentData: NewPayment = {
        organizationId,
        propertyId: utilityBill.propertyId,
        unitId: utilityBill.unitId,
        leaseId: utilityBill.leaseId,
        tenantId: utilityBill.tenantId,
        type: "utility",
        status: "successful",
        method: data.paymentMethod as any, // Cast to enum type
        amount: data.amount,
        currency: "KES", // Default currency, can be made configurable
        transactionDate: data.paidDate ? new Date(data.paidDate) : new Date(),
        description: `Payment for ${utilityBill.utilityType} bill from ${new Date(utilityBill.billingPeriodStart).toLocaleDateString()} to ${new Date(utilityBill.billingPeriodEnd).toLocaleDateString()}`,
        notes: data.notes || null,
        referenceId: data.referenceId || null,
        recordedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const paymentResult = await tx
        .insert(paymentEntity)
        .values(paymentData)
        .returning();
      const paymentId = paymentResult[0].id;

      // Update the utility bill to mark it as paid
      const updateData: Partial<NewUtilityBill> = {
        status: "paid",
        paymentId,
        updatedAt: new Date(),
      };

      const result = await tx
        .update(utilityBillEntity)
        .set(updateData)
        .where(eq(utilityBillEntity.id, data.id))
        .returning();

      return result[0];
    });
  }
}

// Export singleton instance
export const utilityBillsService = new UtilityBillsService();
