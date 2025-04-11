import { z } from "zod";

// Define billing types allowed
const billingTypeEnum = z.enum([
  "landlord_pays",
  "tenant_pays",
  "split",
  "fixed_amount",
]);

// Define lease status values
const leaseStatusEnum = z.enum([
  "active",
  "expired",
  "terminated",
  "pending",
  "renewed",
]);

// Define payment frequency values
const paymentFrequencyEnum = z.enum([
  "monthly",
  "weekly",
  "bi-weekly",
  "quarterly",
  "yearly",
]);

// Base schema for creating and updating leases
const leaseBaseSchema = {
  unitId: z.string().min(1, "Unit ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  startDate: z.date().or(z.string().transform((str) => new Date(str))),
  endDate: z.date().or(z.string().transform((str) => new Date(str))),
  rentAmount: z.number().positive("Rent amount must be positive"),
  depositAmount: z.number().nonnegative("Deposit amount cannot be negative"),
  status: leaseStatusEnum.default("active"),
  paymentDay: z.number().min(1).max(31).default(1),
  paymentFrequency: paymentFrequencyEnum.default("monthly"),

  // Utility settings
  includesWater: z.boolean().default(false),
  includesElectricity: z.boolean().default(false),
  includesGas: z.boolean().default(false),
  includesInternet: z.boolean().default(false),

  // Billing type for each utility
  waterBillingType: billingTypeEnum.default("tenant_pays"),
  electricityBillingType: billingTypeEnum.default("tenant_pays"),
  gasBillingType: billingTypeEnum.default("tenant_pays"),
  internetBillingType: billingTypeEnum.default("tenant_pays"),

  // Fixed amounts for utilities (only used if billing type is fixed_amount)
  waterFixedAmount: z.number().nullish(),
  electricityFixedAmount: z.number().nullish(),
  gasFixedAmount: z.number().nullish(),
  internetFixedAmount: z.number().nullish(),

  // Additional metadata
  documentUrl: z.string().url().nullish(),
  notes: z.string().nullish(),
};

// DTO for creating a new lease
export const createLeaseDto = z
  .object({
    ...leaseBaseSchema,
  })
  .refine(
    (data) => {
      // Start date must be before end date
      return new Date(data.startDate) < new Date(data.endDate);
    },
    {
      message: "Start date must be before end date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // If billing type is fixed_amount, fixed amount must be provided
      if (data.waterBillingType === "fixed_amount") {
        return data.waterFixedAmount != null;
      }
      return true;
    },
    {
      message:
        "Water fixed amount is required when billing type is fixed_amount",
      path: ["waterFixedAmount"],
    }
  )
  .refine(
    (data) => {
      if (data.electricityBillingType === "fixed_amount") {
        return data.electricityFixedAmount != null;
      }
      return true;
    },
    {
      message:
        "Electricity fixed amount is required when billing type is fixed_amount",
      path: ["electricityFixedAmount"],
    }
  )
  .refine(
    (data) => {
      if (data.gasBillingType === "fixed_amount") {
        return data.gasFixedAmount != null;
      }
      return true;
    },
    {
      message: "Gas fixed amount is required when billing type is fixed_amount",
      path: ["gasFixedAmount"],
    }
  )
  .refine(
    (data) => {
      if (data.internetBillingType === "fixed_amount") {
        return data.internetFixedAmount != null;
      }
      return true;
    },
    {
      message:
        "Internet fixed amount is required when billing type is fixed_amount",
      path: ["internetFixedAmount"],
    }
  );

// DTO for updating an existing lease
export const updateLeaseDto = z
  .object({
    id: z.string(),
    ...Object.entries(leaseBaseSchema).reduce(
      (acc, [key, validator]) => ({
        ...acc,
        [key]:
          validator instanceof z.ZodBoolean
            ? validator.optional()
            : validator.optional(),
      }),
      {}
    ),
  })
  .refine(
    (data) => {
      // If both dates are provided, start must be before end
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Start date must be before end date",
      path: ["endDate"],
    }
  );

// DTO for lease ID parameter
export const leaseIdDto = z.object({
  id: z.string().min(1, "Lease ID is required"),
});

// DTO for terminating a lease
export const terminateLeaseDto = z.object({
  id: z.string().min(1, "Lease ID is required"),
  terminationDate: z.date().or(z.string().transform((str) => new Date(str))),
  terminationReason: z.string().min(1, "Termination reason is required"),
  refundAmount: z.number().optional().default(0),
});

// DTO for renewing a lease
export const renewLeaseDto = z.object({
  id: z.string().min(1, "Lease ID is required"),
  newEndDate: z.date().or(z.string().transform((str) => new Date(str))),
  newRentAmount: z
    .number()
    .positive("New rent amount must be positive")
    .optional(),
  preserveDeposit: z.boolean().default(true),
  newDepositAmount: z.number().optional(),
  generateDocument: z.boolean().default(true),
});

// DTO for filtering leases
export const leaseFilterDto = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  status: leaseStatusEnum.optional(),
  search: z.string().optional(),
  startDateFrom: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  startDateTo: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  endDateFrom: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  endDateTo: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

// Export TypeScript types
export type CreateLeaseDto = z.infer<typeof createLeaseDto>;
export type UpdateLeaseDto = z.infer<typeof updateLeaseDto>;
export type LeaseIdDto = z.infer<typeof leaseIdDto>;
export type TerminateLeaseDto = z.infer<typeof terminateLeaseDto>;
export type RenewLeaseDto = z.infer<typeof renewLeaseDto>;
export type LeaseFilterDto = z.infer<typeof leaseFilterDto>;
