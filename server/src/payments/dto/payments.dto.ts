import { z } from "zod";

// Define transaction types
export const TransactionTypeEnum = z.enum([
  "rent",
  "deposit",
  "utility",
  "fee",
  "refund",
  "other",
]);

// Define transaction status values
export const TransactionStatusEnum = z.enum([
  "pending",
  "completed",
  "failed",
  "cancelled",
]);

// Define payment method values
export const PaymentMethodEnum = z.enum([
  "cash",
  "bank_transfer",
  "card",
  "check",
  "mobile_money",
  "other",
]);

// Base schema for creating and updating transactions
const transactionBaseSchema = {
  leaseId: z.string().min(1, "Lease ID is required"),
  amount: z.number().positive("Amount must be positive"),
  type: TransactionTypeEnum,
  category: z.string().optional().nullable(),
  status: TransactionStatusEnum.default("completed"),
  paymentMethod: PaymentMethodEnum.optional(),
  paymentDate: z.date().or(z.string().transform((str) => new Date(str))),
  dueDate: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
};

// DTO for creating a new transaction
export const createTransactionDto = z.object({
  ...transactionBaseSchema,
});

// DTO for updating a transaction
export const updateTransactionDto = z.object({
  id: z.string(),
  ...Object.entries(transactionBaseSchema).reduce(
    (acc, [key, validator]) => ({
      ...acc,
      [key]:
        validator instanceof z.ZodBoolean
          ? validator.optional()
          : validator.optional(),
    }),
    {}
  ),
});

// DTO for transaction ID parameter
export const transactionIdDto = z.object({
  id: z.string(),
});

// DTO for filtering transactions
export const transactionFilterDto = z.object({
  leaseId: z.string().optional(),
  propertyId: z.string().optional(),
  tenantId: z.string().optional(),
  type: TransactionTypeEnum.optional(),
  status: TransactionStatusEnum.optional(),
  dateFrom: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  dateTo: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

// DTO for recording rent payment
export const recordRentPaymentDto = z.object({
  leaseId: z.string().min(1, "Lease ID is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: PaymentMethodEnum,
  paymentDate: z.date().or(z.string().transform((str) => new Date(str))),
  notes: z.string().optional(),
});

// DTO for recording utility bill
export const createUtilityBillDto = z.object({
  leaseId: z.string().min(1, "Lease ID is required"),
  utilityType: z.enum(["water", "electricity", "gas", "internet", "other"]),
  billDate: z.date().or(z.string().transform((str) => new Date(str))),
  dueDate: z.date().or(z.string().transform((str) => new Date(str))),
  amount: z.number().positive("Amount must be positive"),
  tenantResponsibilityPercent: z.number().min(0).max(100).default(100),
  tenantAmount: z.number().min(0),
  landlordAmount: z.number().min(0).default(0),
  isPaid: z.boolean().default(false),
  paidDate: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

// DTO for updating utility bill
export const updateUtilityBillDto = z.object({
  id: z.string(),
  ...Object.entries(createUtilityBillDto.shape)
    .filter(([key]) => key !== "leaseId") // Don't allow changing lease ID
    .reduce(
      (acc, [key, validator]) => ({
        ...acc,
        [key]:
          validator instanceof z.ZodBoolean
            ? validator.optional()
            : validator.optional(),
      }),
      {}
    ),
});

// DTO for marking utility bill as paid
export const markUtilityBillPaidDto = z.object({
  id: z.string(),
  paidDate: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .default(() => new Date()),
  paymentMethod: PaymentMethodEnum.optional(),
  notes: z.string().optional(),
});

// DTO for generating financial report
export const generateFinancialReportDto = z.object({
  propertyId: z.string().optional(),
  dateFrom: z.date().or(z.string().transform((str) => new Date(str))),
  dateTo: z.date().or(z.string().transform((str) => new Date(str))),
  includeDetails: z.boolean().default(false),
  groupBy: z.enum(["property", "type", "month", "tenant"]).default("property"),
});

// Export TypeScript types
export type CreateTransactionDto = z.infer<typeof createTransactionDto>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionDto>;
export type TransactionIdDto = z.infer<typeof transactionIdDto>;
export type TransactionFilterDto = z.infer<typeof transactionFilterDto>;
export type RecordRentPaymentDto = z.infer<typeof recordRentPaymentDto>;
export type CreateUtilityBillDto = z.infer<typeof createUtilityBillDto>;
export type UpdateUtilityBillDto = z.infer<typeof updateUtilityBillDto>;
export type MarkUtilityBillPaidDto = z.infer<typeof markUtilityBillPaidDto>;
export type GenerateFinancialReportDto = z.infer<
  typeof generateFinancialReportDto
>;
