import { z } from "zod";
import {
  subscriptionStatusEnum,
  trialStatusEnum,
} from "../entities/organization.entity";

// DTO for creating an organization
export const createOrganizationDto = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  timezone: z.string().default("UTC"),
  currency: z.string().default("USD"),
  dateFormat: z.string().default("YYYY-MM-DD"),
  logo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

// DTO for updating an organization
export const updateOrganizationDto = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  logo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

// DTO for organization ID operations
export const organizationIdDto = z.object({
  id: z.string(),
});

// DTO for switching active organization
export const switchOrganizationDto = z.object({
  id: z.string(),
});

// DTO for updating organization subscription
export const updateOrganizationSubscriptionDto = z.object({
  id: z.string(),
  subscriptionStatus: z.enum(subscriptionStatusEnum.enumValues).optional(),
  subscriptionPlan: z.string().optional().nullable(),
  maxProperties: z.number().int().positive().optional(),
  maxUsers: z.number().int().positive().optional(),
});

// DTO for updating organization trial
export const updateOrganizationTrialDto = z.object({
  id: z.string(),
  trialStatus: z.enum(trialStatusEnum.enumValues).optional(),
  trialStartedAt: z.date().optional().nullable(),
  trialExpiresAt: z.date().optional().nullable(),
});

// Types derived from DTOs
export type CreateOrganizationDto = z.infer<typeof createOrganizationDto>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationDto>;
export type OrganizationIdDto = z.infer<typeof organizationIdDto>;
export type SwitchOrganizationDto = z.infer<typeof switchOrganizationDto>;
export type UpdateOrganizationSubscriptionDto = z.infer<
  typeof updateOrganizationSubscriptionDto
>;
export type UpdateOrganizationTrialDto = z.infer<
  typeof updateOrganizationTrialDto
>;
