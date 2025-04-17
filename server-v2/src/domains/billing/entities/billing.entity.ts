import { GraphQLContext } from "@infrastructure/graphql/context/types";
import { AuthorizationError } from "@shared/errors/authorization.error";
import { CreateExpenseDto, UpdateExpenseDto } from "../dto/expense.dto";
import { CreatePaymentDto, UpdatePaymentDto } from "../dto/payment.dto";
import {
  CreateUtilityBillDto,
  PayUtilityBillDto,
  UpdateUtilityBillDto,
} from "../dto/utility-bill.dto";
import { expensesService } from "../services/expenses.service";
import { financialService } from "../services/financial.service";
import { paymentsService } from "../services/payments.service";
import { utilityBillsService } from "../services/utility-bills.service";

/**
 * Helper function to check billing permissions
 */
function checkBillingPermissions(
  context: GraphQLContext,
  action: "view" | "manage"
): { organizationId: string; userId: string } {
  const { user, organization, permissions } = context;

  if (!user || !organization) {
    throw new Error("Authentication required");
  }

  const { id: organizationId } = organization;
  const userId = user.id;

  // Check appropriate permission
  let hasPermission = false;

  switch (action) {
    case "view":
      // Assume anyone with property view permissions can view billing
      hasPermission = permissions.canViewProperties;
      break;
    case "manage":
      // Only allow property managers to manage billing
      hasPermission = permissions.canManageProperties;
      break;
  }

  if (!hasPermission) {
    throw new AuthorizationError(
      `You don't have permission to ${action} billing information`
    );
  }

  return { organizationId, userId };
}

export const billingResolvers = {
  Query: {
    // Payment queries
    payments: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      return paymentsService.getPaymentsByOrganization(organizationId);
    },

    payment: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      const payment = await paymentsService.getPaymentById(id);

      if (payment && payment.organizationId !== organizationId) {
        throw new AuthorizationError(
          "You don't have permission to view this payment"
        );
      }

      return payment;
    },

    paymentsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      return paymentsService.getPaymentsByProperty(propertyId, organizationId);
    },

    paymentsByLease: async (
      _: any,
      { leaseId }: { leaseId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      return paymentsService.getPaymentsByLease(leaseId, organizationId);
    },

    paymentsByTenant: async (
      _: any,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      return paymentsService.getPaymentsByTenant(tenantId, organizationId);
    },

    // Expense queries
    expenses: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      return expensesService.getExpensesByOrganization(organizationId);
    },

    expense: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      const expense = await expensesService.getExpenseById(id);

      if (expense && expense.organizationId !== organizationId) {
        throw new AuthorizationError(
          "You don't have permission to view this expense"
        );
      }

      return expense;
    },

    expensesByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      return expensesService.getExpensesByProperty(propertyId, organizationId);
    },

    // Utility bill queries
    utilityBills: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      return utilityBillsService.getUtilityBillsByOrganization(organizationId);
    },

    utilityBill: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
      const utilityBill = await utilityBillsService.getUtilityBillById(id);

      if (utilityBill && utilityBill.organizationId !== organizationId) {
        throw new AuthorizationError(
          "You don't have permission to view this utility bill"
        );
      }

      return utilityBill;
    },

    utilityBillsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "view");
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
      const { organizationId } = checkBillingPermissions(context, "view");
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
      const { organizationId } = checkBillingPermissions(context, "view");
      return financialService.getPropertyFinancialSummary(
        propertyId,
        organizationId,
        period as any,
        startDate,
        endDate
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
      const { organizationId, userId } = checkBillingPermissions(
        context,
        "manage"
      );

      return paymentsService.createPayment({
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
      const { organizationId } = checkBillingPermissions(context, "manage");
      return paymentsService.updatePayment(data, organizationId);
    },

    deletePayment: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "manage");
      return paymentsService.deletePayment(id, organizationId);
    },

    // Expense mutations
    createExpense: async (
      _: any,
      { data }: { data: CreateExpenseDto & { createPayment?: boolean } },
      context: GraphQLContext
    ) => {
      const { organizationId, userId } = checkBillingPermissions(
        context,
        "manage"
      );

      return expensesService.createExpense(
        data,
        organizationId,
        userId,
        data.createPayment || false
      );
    },

    updateExpense: async (
      _: any,
      { data }: { data: UpdateExpenseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "manage");
      return expensesService.updateExpense(data, organizationId);
    },

    deleteExpense: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "manage");
      return expensesService.deleteExpense(id, organizationId);
    },

    // Utility bill mutations
    createUtilityBill: async (
      _: any,
      { data }: { data: CreateUtilityBillDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "manage");

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
      const { organizationId } = checkBillingPermissions(context, "manage");
      return utilityBillsService.updateUtilityBill(data, organizationId);
    },

    deleteUtilityBill: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkBillingPermissions(context, "manage");
      return utilityBillsService.deleteUtilityBill(id, organizationId);
    },

    payUtilityBill: async (
      _: any,
      { data }: { data: PayUtilityBillDto },
      context: GraphQLContext
    ) => {
      const { organizationId, userId } = checkBillingPermissions(
        context,
        "manage"
      );
      return utilityBillsService.payUtilityBill(data, organizationId, userId);
    },
  },
};
