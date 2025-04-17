import { z } from "zod";
import {
  lateFeeTypeEnum,
  leaseStatusEnum,
  paymentFrequencyEnum,
  utilityBillingTypeEnum,
} from "../entities/lease.entity"; // Assuming entity file location

// DTO for creating a lease
export const createLeaseDto = z.object({
  unitId: z.string(),
  propertyId: z.string(), // Required for association, derived from unit in service
  status: z.enum(leaseStatusEnum.enumValues).default("draft"),
  startDate: z.string(), // Use string for date input, convert in service
  endDate: z.string(),
  moveInDate: z.string().optional().nullable(),
  moveOutDate: z.string().optional().nullable(),
  rentAmount: z.number().positive("Rent amount must be positive"),
  depositAmount: z.number().min(0).default(0),
  paymentDay: z.number().int().min(1).max(31).default(1),
  paymentFrequency: z.enum(paymentFrequencyEnum.enumValues).default("monthly"),
  gracePeriodDays: z.number().int().min(0).default(0),
  lateFeeType: z.enum(lateFeeTypeEnum.enumValues).default("no_fee"),
  lateFeeAmount: z.number().min(0).optional().nullable(),
  lateFeeMaxAmount: z.number().min(0).optional().nullable(),
  waterBillingType: z
    .enum(utilityBillingTypeEnum.enumValues)
    .default("tenant_pays_provider"),
  electricityBillingType: z
    .enum(utilityBillingTypeEnum.enumValues)
    .default("tenant_pays_provider"),
  gasBillingType: z
    .enum(utilityBillingTypeEnum.enumValues)
    .default("tenant_pays_provider"),
  internetBillingType: z
    .enum(utilityBillingTypeEnum.enumValues)
    .default("tenant_pays_provider"),
  trashBillingType: z
    .enum(utilityBillingTypeEnum.enumValues)
    .default("included_in_rent"),
  waterFixedAmount: z.number().min(0).optional().nullable(),
  electricityFixedAmount: z.number().min(0).optional().nullable(),
  gasFixedAmount: z.number().min(0).optional().nullable(),
  internetFixedAmount: z.number().min(0).optional().nullable(),
  trashFixedAmount: z.number().min(0).optional().nullable(),
  petsAllowed: z.boolean().default(false),
  petPolicyNotes: z.string().optional().nullable(),
  smokingAllowed: z.boolean().default(false),
  leaseTerminationTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  organizationId: z.string(), // Required on creation, likely from context
  createdBy: z.string(), // Required on creation, from context user
});

// DTO for updating a lease
export const updateLeaseDto = createLeaseDto
  .partial() // Make all fields optional
  .omit({
    unitId: true,
    propertyId: true,
    organizationId: true,
    createdBy: true,
  }) // Prevent changing core associations/metadata
  .extend({
    id: z.string(), // ID is required for update
  });

// DTO for lease ID operations
export const leaseIdDto = z.object({
  id: z.string(),
});

// Types based on the schemas
export type CreateLeaseDto = z.infer<typeof createLeaseDto>;
export type UpdateLeaseDto = z.infer<typeof updateLeaseDto>;
export type LeaseIdDto = z.infer<typeof leaseIdDto>;
