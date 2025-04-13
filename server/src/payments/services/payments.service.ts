import { createId } from "@/db/utils";
import { ConflictError, NotFoundError, PermissionError } from "@/errors";
import { leasesRepository } from "@/leases/repositories/leases.repository";
import { propertiesRepository } from "@/properties/repositories/properties.repository";
import {
  CreateTransactionDto,
  CreateUtilityBillDto,
  GenerateFinancialReportDto,
  MarkUtilityBillPaidDto,
  RecordRentPaymentDto,
  TransactionFilterDto,
  UpdateTransactionDto,
  UpdateUtilityBillDto,
} from "../dto/payments.dto";
import { paymentsRepository } from "../repositories/payments.repository";
import {
  FinancialReport,
  Transaction,
  TransactionWithRelations,
  UtilityBill,
  UtilityBillWithRelations,
} from "../types";

export class PaymentsService {
  /**
   * Get transactions with filtering and pagination
   */
  async getTransactions(
    filters: TransactionFilterDto,
    userId: string,
    userRole: string
  ): Promise<{
    transactions: TransactionWithRelations[];
    total: number;
    pages: number;
  }> {
    // Check property access if propertyId is provided
    if (filters.propertyId) {
      await this.ensurePropertyAccess(filters.propertyId, userId, userRole);
    }

    // Check lease access if leaseId is provided
    if (filters.leaseId) {
      await this.ensureLeaseAccess(filters.leaseId, userId, userRole);
    }

    const transactions = await paymentsRepository.findAllTransactions(filters);
    const total = await paymentsRepository.countTransactions(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { transactions, total, pages };
  }

  /**
   * Get a transaction by ID
   */
  async getTransactionById(
    transactionId: string,
    userId: string,
    userRole: string
  ): Promise<TransactionWithRelations> {
    const transaction = await paymentsRepository.findTransactionById(
      transactionId
    );

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    // Ensure user has access to the related lease/property
    await this.ensureLeaseAccess(transaction.leaseId, userId, userRole);

    return transaction;
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    transactionData: CreateTransactionDto,
    userId: string,
    userRole: string
  ): Promise<Transaction> {
    // Ensure user has access to the lease
    await this.ensureLeaseAccess(
      transactionData.leaseId,
      userId,
      userRole,
      true
    );

    // Verify that lease exists
    const lease = await leasesRepository.findById(transactionData.leaseId);
    if (!lease) {
      throw new NotFoundError("Lease not found");
    }

    return paymentsRepository.createTransaction({
      ...transactionData,
      id: createId(), // This will be handled by the database, but adding for clarity
      recordedBy: userId,
    });
  }

  /**
   * Record a rent payment (simplified transaction creation for rent)
   */
  async recordRentPayment(
    paymentData: RecordRentPaymentDto,
    userId: string,
    userRole: string
  ): Promise<Transaction> {
    // Ensure user has access to collect payments for this lease
    await this.ensureLeaseAccess(paymentData.leaseId, userId, userRole, true);

    // Verify that lease exists and is active
    const lease = await leasesRepository.findById(paymentData.leaseId);
    if (!lease) {
      throw new NotFoundError("Lease not found");
    }

    if (lease.status !== "active") {
      throw new ConflictError("Cannot record payment for inactive lease");
    }

    // Create the rent payment transaction
    return paymentsRepository.createTransaction({
      leaseId: paymentData.leaseId,
      amount: paymentData.amount,
      type: "rent",
      status: "completed",
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate,
      notes: paymentData.notes || "Regular rent payment",
      recordedBy: userId,
    });
  }

  /**
   * Update a transaction
   */
  async updateTransaction(
    transactionId: string,
    transactionData: UpdateTransactionDto,
    userId: string,
    userRole: string
  ): Promise<Transaction> {
    // Check if transaction exists
    const transaction = await paymentsRepository.findTransactionById(
      transactionId
    );
    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    // Ensure user has access to this transaction's lease
    await this.ensureLeaseAccess(transaction.leaseId, userId, userRole, true);

    // If changing lease ID, check that user has access to the new lease as well
    if (
      transactionData.leaseId &&
      transactionData.leaseId !== transaction.leaseId
    ) {
      await this.ensureLeaseAccess(
        transactionData.leaseId,
        userId,
        userRole,
        true
      );

      // Also verify that the new lease exists
      const newLease = await leasesRepository.findById(transactionData.leaseId);
      if (!newLease) {
        throw new NotFoundError("New lease not found");
      }
    }

    return paymentsRepository.updateTransaction(transactionId, transactionData);
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(
    transactionId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Check if transaction exists
    const transaction = await paymentsRepository.findTransactionById(
      transactionId
    );
    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    // Only admins and landlords can delete transactions
    if (!["ADMIN", "LANDLORD"].includes(userRole)) {
      throw new PermissionError(
        "You do not have permission to delete transactions"
      );
    }

    // Ensure user has access to this transaction's lease
    await this.ensureLeaseAccess(transaction.leaseId, userId, userRole, true);

    await paymentsRepository.deleteTransaction(transactionId);
  }

  /**
   * Get utility bills with filtering and pagination
   */
  async getUtilityBills(
    filters: {
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
    userId: string,
    userRole: string
  ): Promise<{
    utilityBills: UtilityBillWithRelations[];
    total: number;
    pages: number;
  }> {
    // Check property access if propertyId is provided
    if (filters.propertyId) {
      await this.ensurePropertyAccess(filters.propertyId, userId, userRole);
    }

    // Check lease access if leaseId is provided
    if (filters.leaseId) {
      await this.ensureLeaseAccess(filters.leaseId, userId, userRole);
    }

    const utilityBills = await paymentsRepository.findAllUtilityBills(filters);
    const total = await paymentsRepository.countUtilityBills(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { utilityBills, total, pages };
  }

  /**
   * Get a utility bill by ID
   */
  async getUtilityBillById(
    billId: string,
    userId: string,
    userRole: string
  ): Promise<UtilityBillWithRelations> {
    const bill = await paymentsRepository.findUtilityBillById(billId);

    if (!bill) {
      throw new NotFoundError("Utility bill not found");
    }

    // Ensure user has access to the related lease/property
    await this.ensureLeaseAccess(bill.leaseId, userId, userRole);

    return bill;
  }

  /**
   * Create a new utility bill
   */
  async createUtilityBill(
    billData: CreateUtilityBillDto,
    userId: string,
    userRole: string
  ): Promise<UtilityBill> {
    // Ensure user has access to the lease
    await this.ensureLeaseAccess(billData.leaseId, userId, userRole, true);

    // Verify that lease exists
    const lease = await leasesRepository.findById(billData.leaseId);
    if (!lease) {
      throw new NotFoundError("Lease not found");
    }

    return paymentsRepository.createUtilityBill({
      ...billData,
      id: createId(), // This will be handled by the database, but adding for clarity
    });
  }

  /**
   * Update a utility bill
   */
  async updateUtilityBill(
    billId: string,
    billData: UpdateUtilityBillDto,
    userId: string,
    userRole: string
  ): Promise<UtilityBill> {
    // Check if bill exists
    const bill = await paymentsRepository.findUtilityBillById(billId);
    if (!bill) {
      throw new NotFoundError("Utility bill not found");
    }

    // Ensure user has access to this bill's lease
    await this.ensureLeaseAccess(bill.leaseId, userId, userRole, true);

    return paymentsRepository.updateUtilityBill(billId, billData);
  }

  /**
   * Mark a utility bill as paid
   */
  async markUtilityBillPaid(
    data: MarkUtilityBillPaidDto,
    userId: string,
    userRole: string
  ): Promise<{ bill: UtilityBill; transaction: Transaction }> {
    // Check if bill exists
    const bill = await paymentsRepository.findUtilityBillById(data.id);
    if (!bill) {
      throw new NotFoundError("Utility bill not found");
    }

    // Ensure user has access to this bill's lease
    await this.ensureLeaseAccess(bill.leaseId, userId, userRole, true);

    // If bill is already paid, throw error
    if (bill.isPaid) {
      throw new ConflictError("Utility bill is already paid");
    }

    return paymentsRepository.markUtilityBillPaid(
      data.id,
      data.paidDate,
      data.paymentMethod,
      data.notes,
      userId
    );
  }

  /**
   * Delete a utility bill
   */
  async deleteUtilityBill(
    billId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Check if bill exists
    const bill = await paymentsRepository.findUtilityBillById(billId);
    if (!bill) {
      throw new NotFoundError("Utility bill not found");
    }

    // Only admins and landlords can delete utility bills
    if (!["ADMIN", "LANDLORD"].includes(userRole)) {
      throw new PermissionError(
        "You do not have permission to delete utility bills"
      );
    }

    // Ensure user has access to this bill's lease
    await this.ensureLeaseAccess(bill.leaseId, userId, userRole, true);

    // If bill is already paid and has a transaction, prevent deletion
    if (bill.isPaid && bill.relatedTransaction) {
      throw new ConflictError(
        "Cannot delete a paid utility bill with recorded payment. Void the payment first."
      );
    }

    await paymentsRepository.deleteUtilityBill(billId);
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(
    reportData: GenerateFinancialReportDto,
    userId: string,
    userRole: string
  ): Promise<FinancialReport> {
    // Check property access if propertyId is provided
    if (reportData.propertyId) {
      await this.ensurePropertyAccess(reportData.propertyId, userId, userRole);
    }

    // Get financial summary for the date range
    const summary = await paymentsRepository.getFinancialSummary(
      reportData.dateFrom,
      reportData.dateTo,
      reportData.propertyId
    );

    // If details are requested, get transactions for the period
    let transactions;
    if (reportData.includeDetails) {
      const transactionResult = await paymentsRepository.findAllTransactions({
        propertyId: reportData.propertyId,
        dateFrom: reportData.dateFrom,
        dateTo: reportData.dateTo,
        limit: 1000, // Set a reasonable limit
      });
      transactions = transactionResult;
    }

    // Group results based on the requested grouping
    let groupedResults;
    switch (reportData.groupBy) {
      case "property":
        groupedResults = summary.revenueByProperty;
        break;
      case "type":
        groupedResults = summary.revenueByType;
        break;
      case "month":
        groupedResults = summary.revenueByMonth;
        break;
      default:
        groupedResults = null;
    }

    return {
      dateRange: {
        from: reportData.dateFrom,
        to: reportData.dateTo,
      },
      summary,
      transactions: reportData.includeDetails ? transactions : undefined,
      groupedResults,
      generatedBy: userId,
      generatedAt: new Date(),
    };
  }

  /**
   * Helper method to check if user has access to a property
   */
  private async ensurePropertyAccess(
    propertyId: string,
    userId: string,
    userRole: string,
    requireCollectPaymentPermission = false
  ): Promise<void> {
    // Admins have access to all properties
    if (userRole === "ADMIN") {
      return;
    }

    // For landlords, check if they own the property
    if (userRole === "LANDLORD") {
      const property = await propertiesRepository.findByIdAndOwner(
        propertyId,
        userId
      );
      if (!property) {
        throw new PermissionError(
          "You do not have permission to access this property"
        );
      }
      return;
    }

    // For caretakers, check if they are assigned to the property
    if (userRole === "CARETAKER") {
      const property = await propertiesRepository.findById(propertyId);
      if (!property || property.caretakerId !== userId) {
        throw new PermissionError(
          "You do not have permission to access this property"
        );
      }

      // If collect payment permission is required, caretakers should have it
      if (requireCollectPaymentPermission) {
        // Caretakers can collect payments by default, so we're good
        return;
      }

      return;
    }

    // For agents, check if they are assigned to the property
    if (userRole === "AGENT") {
      const property = await propertiesRepository.findById(propertyId);
      if (!property || property.agentId !== userId) {
        throw new PermissionError(
          "You do not have permission to access this property"
        );
      }

      // Agents need special permission to collect payments
      if (requireCollectPaymentPermission) {
        throw new PermissionError(
          "Agents do not have permission to collect payments"
        );
      }

      return;
    }

    // Default case - no access
    throw new PermissionError(
      "You do not have permission to access this property"
    );
  }

  /**
   * Helper method to check if user has access to a lease
   */
  private async ensureLeaseAccess(
    leaseId: string,
    userId: string,
    userRole: string,
    requireCollectPaymentPermission = false
  ): Promise<void> {
    // Admins have access to all leases
    if (userRole === "ADMIN") {
      return;
    }

    // Get the lease with property info
    const lease = await leasesRepository.findById(leaseId);
    if (!lease) {
      throw new NotFoundError("Lease not found");
    }

    // Get the property ID from the lease's unit
    const propertyId = lease.unit?.property?.id;
    if (!propertyId) {
      throw new NotFoundError("Property information not found for this lease");
    }

    // Use property access check
    await this.ensurePropertyAccess(
      propertyId,
      userId,
      userRole,
      requireCollectPaymentPermission
    );
  }
}

// Export a singleton instance
export const paymentsService = new PaymentsService();
