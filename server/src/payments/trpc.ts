import { router } from "@/trpc/core";
import {
  paymentsCollectProcedure,
  paymentsViewProcedure,
  reportsViewProcedure,
} from "@/trpc/middleware";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTransactionDto,
  createUtilityBillDto,
  generateFinancialReportDto,
  markUtilityBillPaidDto,
  recordRentPaymentDto,
  transactionFilterDto,
  transactionIdDto,
  updateTransactionDto,
  updateUtilityBillDto,
} from "./dto/payments.dto";
import { paymentsService } from "./services/payments.service";

export const paymentsRouter = router({
  // Get all transactions with filtering and pagination
  getAllTransactions: paymentsViewProcedure
    .input(transactionFilterDto)
    .query(async ({ ctx, input }) => {
      try {
        const { transactions, total, pages } =
          await paymentsService.getTransactions(
            input,
            ctx.user.id,
            ctx.user.role
          );
        return { transactions, total, pages };
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching transactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transactions",
        });
      }
    }),

  // Get transaction by ID
  getTransactionById: paymentsViewProcedure
    .input(transactionIdDto)
    .query(async ({ ctx, input }) => {
      try {
        return paymentsService.getTransactionById(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching transaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transaction",
        });
      }
    }),

  // Create a new transaction
  createTransaction: paymentsCollectProcedure
    .input(createTransactionDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return paymentsService.createTransaction(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error creating transaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create transaction",
        });
      }
    }),

  // Record a rent payment (simplified transaction creation)
  recordRentPayment: paymentsCollectProcedure
    .input(recordRentPaymentDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return paymentsService.recordRentPayment(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error recording rent payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record rent payment",
        });
      }
    }),

  // Update a transaction
  updateTransaction: paymentsCollectProcedure
    .input(updateTransactionDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return paymentsService.updateTransaction(
          input.id,
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error updating transaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update transaction",
        });
      }
    }),

  // Delete a transaction
  deleteTransaction: paymentsCollectProcedure
    .input(transactionIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        await paymentsService.deleteTransaction(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
        return { success: true };
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error deleting transaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete transaction",
        });
      }
    }),

  // Get all utility bills with filtering and pagination
  getAllUtilityBills: paymentsViewProcedure
    .input(
      z.object({
        leaseId: z.string().optional(),
        propertyId: z.string().optional(),
        tenantId: z.string().optional(),
        utilityType: z.string().optional(),
        isPaid: z.boolean().optional(),
        dateFrom: z
          .date()
          .or(z.string().transform((str) => new Date(str)))
          .optional(),
        dateTo: z
          .date()
          .or(z.string().transform((str) => new Date(str)))
          .optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { utilityBills, total, pages } =
          await paymentsService.getUtilityBills(
            input,
            ctx.user.id,
            ctx.user.role
          );
        return { utilityBills, total, pages };
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching utility bills:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch utility bills",
        });
      }
    }),

  // Get utility bill by ID
  getUtilityBillById: paymentsViewProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return paymentsService.getUtilityBillById(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error fetching utility bill:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch utility bill",
        });
      }
    }),

  // Create a new utility bill
  createUtilityBill: paymentsCollectProcedure
    .input(createUtilityBillDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return paymentsService.createUtilityBill(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error creating utility bill:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create utility bill",
        });
      }
    }),

  // Update a utility bill
  updateUtilityBill: paymentsCollectProcedure
    .input(updateUtilityBillDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return paymentsService.updateUtilityBill(
          input.id,
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error updating utility bill:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update utility bill",
        });
      }
    }),

  // Mark a utility bill as paid
  markUtilityBillPaid: paymentsCollectProcedure
    .input(markUtilityBillPaidDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return paymentsService.markUtilityBillPaid(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error marking utility bill as paid:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark utility bill as paid",
        });
      }
    }),

  // Delete a utility bill
  deleteUtilityBill: paymentsCollectProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await paymentsService.deleteUtilityBill(
          input.id,
          ctx.user.id,
          ctx.user.role
        );
        return { success: true };
      } catch (error: any) {
        if (error.name === "NotFoundError") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        if (error.name === "ConflictError") {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        console.error("Error deleting utility bill:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete utility bill",
        });
      }
    }),

  // Generate financial report
  generateFinancialReport: reportsViewProcedure
    .input(generateFinancialReportDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return paymentsService.generateFinancialReport(
          input,
          ctx.user.id,
          ctx.user.role
        );
      } catch (error: any) {
        if (error.name === "PermissionError") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: error.message,
          });
        }
        console.error("Error generating financial report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate financial report",
        });
      }
    }),
});
