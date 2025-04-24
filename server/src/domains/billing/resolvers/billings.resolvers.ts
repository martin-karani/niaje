// src/domains/billing/resolvers/billings.resolvers.ts

import { checkFinancialPermissions } from "@/infrastructure/auth/utils/permission-utils";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
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
import { expensesService } from "../services/expense.service";
import { paymentsService } from "../services/payments.service";
import { utilityBillsService } from "../services/utility-bill.service";

export const billingResolvers = {
  Query: {
    // Payment queries
    payments: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return paymentsService.getPaymentsByOrganization(organizationId);
    },

    payment: async (_: any, { id }: PaymentIdDto, context: GraphQLContext) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return paymentsService.getPaymentById(id);
    },

    paymentsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return paymentsService.getPaymentsByProperty(propertyId, organizationId);
    },

    paymentsByLease: async (
      _: any,
      { leaseId }: { leaseId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return paymentsService.getPaymentsByLease(leaseId, organizationId);
    },

    paymentsByTenant: async (
      _: any,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return paymentsService.getPaymentsByTenant(tenantId, organizationId);
    },

    // Expense queries
    expenses: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return expensesService.getExpensesByOrganization(organizationId);
    },

    expense: async (_: any, { id }: ExpenseIdDto, context: GraphQLContext) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return expensesService.getExpenseById(id);
    },

    expensesByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return expensesService.getExpensesByProperty(propertyId, organizationId);
    },

    // Utility bill queries
    utilityBills: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return utilityBillsService.getUtilityBillsByOrganization(organizationId);
    },

    utilityBill: async (
      _: any,
      { id }: UtilityBillIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
      return utilityBillsService.getUtilityBillById(id);
    },

    utilityBillsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
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
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );
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
      const { organizationId } = await checkFinancialPermissions(
        context,
        "view"
      );

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
      const { organizationId, userId } = await checkFinancialPermissions(
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
      const { organizationId } = await checkFinancialPermissions(
        context,
        "manage"
      );
      return paymentsService.updatePayment(data.id, organizationId, data);
    },

    deletePayment: async (
      _: any,
      { id }: PaymentIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "manage"
      );
      await paymentsService.deletePayment(id, organizationId);
      return true;
    },

    // Expense mutations
    createExpense: async (
      _: any,
      { data }: { data: CreateExpenseDto },
      context: GraphQLContext
    ) => {
      const { organizationId, userId } = await checkFinancialPermissions(
        context,
        "manage"
      );

      return expensesService.createExpense(
        {
          ...data,
          organizationId,
          recordedBy: userId,
        },
        organizationId,
        userId,
        data.createPayment
      );
    },

    updateExpense: async (
      _: any,
      { data }: { data: UpdateExpenseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "manage"
      );
      return expensesService.updateExpense(data, organizationId);
    },

    deleteExpense: async (
      _: any,
      { id }: ExpenseIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "manage"
      );
      await expensesService.deleteExpense(id, organizationId);
      return true;
    },

    // Utility bill mutations
    createUtilityBill: async (
      _: any,
      { data }: { data: CreateUtilityBillDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkFinancialPermissions(
        context,
        "manage"
      );
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
      const { organizationId } = await checkFinancialPermissions(
        context,
        "manage"
      );
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
      const { organizationId } = await checkFinancialPermissions(
        context,
        "manage"
      );
      await utilityBillsService.deleteUtilityBill(id, organizationId);
      return true;
    },

    payUtilityBill: async (
      _: any,
      { data }: { data: PayUtilityBillDto },
      context: GraphQLContext
    ) => {
      const { organizationId, userId } = await checkFinancialPermissions(
        context,
        "manage"
      );

      return utilityBillsService.payUtilityBill(data, organizationId, userId);
    },
  },
};
