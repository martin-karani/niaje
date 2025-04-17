import { z } from "zod";
import { expenseCategoryEnum } from "../entities/expense.entity";

// DTO for creating an expense
export const createExpenseDto = z.object({
  propertyId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  category: z.enum(expenseCategoryEnum.enumValues),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.string(), // Date string, will convert to Date
  description: z.string(),
  vendor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createPayment: z.boolean().optional(),
});

// DTO for updating an expense
export const updateExpenseDto = z.object({
  id: z.string(),
  category: z.enum(expenseCategoryEnum.enumValues).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  expenseDate: z.string().optional(), // Date string
  description: z.string().optional(),
  vendor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// DTO for expense ID operations
export const expenseIdDto = z.object({
  id: z.string(),
});

// Types based on the schemas
export type CreateExpenseDto = z.infer<typeof createExpenseDto>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseDto>;
export type ExpenseIdDto = z.infer<typeof expenseIdDto>;
