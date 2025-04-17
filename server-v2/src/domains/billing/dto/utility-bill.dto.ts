import { z } from "zod";
import {
  utilityBillStatusEnum,
  utilityTypeEnum,
} from "../entities/utility-bill.entity";

// DTO for creating a utility bill
export const createUtilityBillDto = z.object({
  propertyId: z.string(),
  unitId: z.string(),
  leaseId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  utilityType: z.enum(utilityTypeEnum.enumValues),
  billingPeriodStart: z.string(), // Date string, will convert to Date
  billingPeriodEnd: z.string(), // Date string, will convert to Date
  dueDate: z.string(), // Date string, will convert to Date
  amount: z.number().positive("Amount must be positive"),
  status: z.enum(utilityBillStatusEnum.enumValues).default("due"),
  meterReadingStart: z.number().optional().nullable(),
  meterReadingEnd: z.number().optional().nullable(),
  consumption: z.number().optional().nullable(),
  rate: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  organizationId: z.string(), // Required on creation, likely from context
});

// DTO for updating a utility bill
export const updateUtilityBillDto = z.object({
  id: z.string(),
  status: z.enum(utilityBillStatusEnum.enumValues).optional(),
  meterReadingStart: z.number().optional().nullable(),
  meterReadingEnd: z.number().optional().nullable(),
  consumption: z.number().optional().nullable(),
  rate: z.number().optional().nullable(),
  amount: z.number().positive("Amount must be positive").optional(),
  notes: z.string().optional().nullable(),
  dueDate: z.string().optional(), // Date string
  billingPeriodStart: z.string().optional(), // Date string
  billingPeriodEnd: z.string().optional(), // Date string
});

// DTO for recording payment for a utility bill
export const payUtilityBillDto = z.object({
  id: z.string(),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.string(),
  referenceId: z.string().optional().nullable(),
  paidDate: z.string().optional(), // Date string, will default to current date
  notes: z.string().optional().nullable(),
});

// DTO for utility bill ID operations
export const utilityBillIdDto = z.object({
  id: z.string(),
});

// Types based on the schemas
export type CreateUtilityBillDto = z.infer<typeof createUtilityBillDto>;
export type UpdateUtilityBillDto = z.infer<typeof updateUtilityBillDto>;
export type PayUtilityBillDto = z.infer<typeof payUtilityBillDto>;
export type UtilityBillIdDto = z.infer<typeof utilityBillIdDto>;
