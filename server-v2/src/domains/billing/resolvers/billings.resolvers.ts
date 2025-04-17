import { checkPermissions } from "@infrastructure/auth/permissions"; // Placeholder permission check
import { GraphQLContext } from "@infrastructure/graphql/context/types"; // Adjusted path
import {
  CreateExpenseDto,
  ExpenseIdDto,
  UpdateExpenseDto,
} from "../dto/expense.dto";
import {
  CreatePaymentDto,
  PaymentIdDto,
  UpdatePaymentDto,
} from "../dto/payment.dto";
import {
  CreateUtilityBillDto,
  PayUtilityBillDto,
  UpdateUtilityBillDto,
  UtilityBillIdDto,
} from "../dto/utility-bill.dto";
import { expensesService } from "../services/expenses.service";
import { paymentsService } from "../services/payments.service";
import { utilityBillsService } from "../services/utility-bills.service";

export const billingResolvers = {
  Query: {
    // Payment queries
    payments: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return paymentsService.getPaymentsByOrganization(organizationId);
    },

    payment: async (_: any, { id }: PaymentIdDto, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return paymentsService.getPaymentById(id, organizationId);
    },

    paymentsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return paymentsService.getPaymentsByProperty(propertyId, organizationId);
    },

    paymentsByLease: async (
      _: any,
      { leaseId }: { leaseId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return paymentsService.getPaymentsByLease(leaseId, organizationId);
    },

    paymentsByTenant: async (
      _: any,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return paymentsService.getPaymentsByTenant(tenantId, organizationId);
    },

    // Expense queries
    expenses: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return expensesService.getExpensesByOrganization(organizationId);
    },

    expense: async (_: any, { id }: ExpenseIdDto, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return expensesService.getExpenseById(id, organizationId);
    },

    expensesByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return expensesService.getExpensesByProperty(propertyId, organizationId);
    },

    // Utility bill queries
    utilityBills: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return utilityBillsService.getUtilityBillsByOrganization(organizationId);
    },

    utilityBill: async (
      _: any,
      { id }: UtilityBillIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return utilityBillsService.getUtilityBillById(id, organizationId);
    },

    utilityBillsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return utilityBillsService.getUtilityBillsByProperty(
        propertyId,
        organizationId
      );
    },

    utilityBillsByUnit: async (
      _: any,
      { unitId }: { unitId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");
      return utilityBillsService.getUtilityBillsByUnit(unitId, organizationId);
    },

    // Financial summary
    propertyFinancialSummary: async (
      _: any,
      {
        propertyId,
        period,
        startDate,
        endDate,
      }: {
        propertyId: string;
        period?: string;
        startDate?: string;
        endDate?: string;
      },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewFinancial");

      // Default to month if not specified
      const reportPeriod = period || "month";

      // For custom period, both dates are required
      if (reportPeriod === "custom" && (!startDate || !endDate)) {
        throw new Error(
          "Both startDate and endDate are required for custom period"
        );
      }

      // Convert date strings to Date objects if provided
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;

      return paymentsService.getPropertyFinancialSummary(
        propertyId,
        organizationId,
        reportPeriod as any,
        startDateObj,
        endDateObj
      );
    },
  },

  Mutation: {
    // Payment mutations
    createPayment: async (
      _: any,
      { data }: { data: CreatePaymentDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      const userId = context.user?.id;
      if (!userId) {
        throw new Error("User context not found for recording payment");
      }

      return paymentsService.recordPayment({
        ...data,
        organizationId,
        recordedBy: userId,
      });
    },

    updatePayment: async (
      _: any,
      { data }: { data: UpdatePaymentDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      return paymentsService.updatePayment(data.id, organizationId, data);
    },

    deletePayment: async (
      _: any,
      { id }: PaymentIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      await paymentsService.deletePayment(id, organizationId);
      return true;
    },

    // Expense mutations
    createExpense: async (
      _: any,
      { data }: { data: CreateExpenseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      const userId = context.user?.id;
      if (!userId) {
        throw new Error("User context not found for recording expense");
      }

      return expensesService.recordExpense({
        ...data,
        organizationId,
        recordedBy: userId,
      });
    },

    updateExpense: async (
      _: any,
      { data }: { data: UpdateExpenseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      return expensesService.updateExpense(data.id, organizationId, data);
    },

    deleteExpense: async (
      _: any,
      { id }: ExpenseIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      await expensesService.deleteExpense(id, organizationId);
      return true;
    },

    // Utility bill mutations
    createUtilityBill: async (
      _: any,
      { data }: { data: CreateUtilityBillDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      return utilityBillsService.createUtilityBill({
        ...data,
        organizationId,
      });
    },

    updateUtilityBill: async (
      _: any,
      { data }: { data: UpdateUtilityBillDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      return utilityBillsService.updateUtilityBill(
        data.id,
        organizationId,
        data
      );
    },

    deleteUtilityBill: async (
      _: any,
      { id }: UtilityBillIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      await utilityBillsService.deleteUtilityBill(id, organizationId);
      return true;
    },

    payUtilityBill: async (
      _: any,
      { data }: { data: PayUtilityBillDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageFinancial");
      const userId = context.user?.id;
      if (!userId) {
        throw new Error("User context not found for recording payment");
      }

      return utilityBillsService.recordUtilityBillPayment(
        data.id,
        organizationId,
        {
          amount: data.amount,
          method: data.paymentMethod,
          referenceId: data.referenceId,
          paidDate: data.paidDate ? new Date(data.paidDate) : new Date(),
          notes: data.notes,
          recordedBy: userId,
        }
      );
    },
  },
};

// Placeholder permission check function
// Replace with your actual permission logic
function checkPermissions(
  context: GraphQLContext,
  permission: string
): { organizationId: string } {
  const { organization, user } = context;

  if (!user) {
    throw new Error("Authentication required");
  }

  if (!organization) {
    throw new Error("No active organization selected");
  }

  // Check appropriate permission - basic implementation
  if (permission === "viewFinancial") {
    // All staff can view financial data
    if (!["admin", "agent_owner", "agent_staff"].includes(user.role)) {
      throw new Error("You don't have permission to view financial data");
    }
  } else if (permission === "manageFinancial") {
    // Only admins and owners can manage financial data
    if (!["admin", "agent_owner"].includes(user.role)) {
      throw new Error("You don't have permission to manage financial data");
    }
  }

  return { organizationId: organization.id };
}
