import { z } from "zod";

// Validation schema for creating a card checkout
export const createCardCheckoutDto = z.object({
  organizationId: z.string(),
  planId: z.string(),
  billingInterval: z.enum(["month", "year"]),
});

// Validation schema for creating an Mpesa payment
export const createMpesaPaymentDto = z.object({
  organizationId: z.string(),
  planId: z.string(),
  billingInterval: z.enum(["month", "year"]),
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/, {
    message: "Phone number must be a valid format with 10-15 digits",
  }),
});

export const verifyPaymentDto = z.object({
  transactionId: z.string(),
});

export const subscriptionStatusDto = z.object({
  organizationId: z.string().optional(),
});

// Types derived from the schemas
export type CreateCardCheckoutDto = z.infer<typeof createCardCheckoutDto>;
export type CreateMpesaPaymentDto = z.infer<typeof createMpesaPaymentDto>;
export type VerifyPaymentDto = z.infer<typeof verifyPaymentDto>;
export type SubscriptionStatusDto = z.infer<typeof subscriptionStatusDto>;
