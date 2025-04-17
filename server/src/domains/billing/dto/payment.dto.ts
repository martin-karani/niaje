import { z } from "zod";
import {
  paymentMethodEnum,
  paymentStatusEnum,
  paymentTypeEnum,
} from "../entities/payment.entity";

// DTO for creating a payment
export const createPaymentDto = z.object({
  propertyId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  leaseId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  type: z.enum(paymentTypeEnum.enumValues),
  method: z.enum(paymentMethodEnum.enumValues),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("KES"),
  transactionDate: z.string().optional(), // Date string, will convert to Date
  dueDate: z.string().optional().nullable(), // Date string
  paidDate: z.string().optional().nullable(), // Date string
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  organizationId: z.string(), // Required on creation, likely from context
  recordedBy: z.string(), // Required on creation, from context user
});

// DTO for updating a payment
export const updatePaymentDto = z.object({
  id: z.string(),
  status: z.enum(paymentStatusEnum.enumValues).optional(),
  method: z.enum(paymentMethodEnum.enumValues).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  transactionDate: z.string().optional(), // Date string
  dueDate: z.string().optional().nullable(), // Date string
  paidDate: z.string().optional().nullable(), // Date string
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
});

// DTO for payment ID operations
export const paymentIdDto = z.object({
  id: z.string(),
});

// Types based on the schemas
export type CreatePaymentDto = z.infer<typeof createPaymentDto>;
export type UpdatePaymentDto = z.infer<typeof updatePaymentDto>;
export type PaymentIdDto = z.infer<typeof paymentIdDto>;
