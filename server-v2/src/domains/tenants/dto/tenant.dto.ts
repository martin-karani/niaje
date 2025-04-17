import { z } from "zod";
import { tenantStatusEnum } from "../entities/tenant.entity"; // Assuming entity file location

// DTO for creating a tenant
export const createTenantDto = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  userId: z.string().optional().nullable(), // Optional link to user account
  status: z.enum(tenantStatusEnum.enumValues).default("active"),
  dateOfBirth: z.string().optional().nullable(), // Use string for date input, convert in service
  occupation: z.string().optional().nullable(),
  employer: z.string().optional().nullable(),
  income: z.number().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactEmail: z.string().email().optional().nullable(),
  expectedMoveInDate: z.string().optional().nullable(),
  actualMoveInDate: z.string().optional().nullable(),
  expectedMoveOutDate: z.string().optional().nullable(),
  actualMoveOutDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  organizationId: z.string(), // Required on creation, likely from context
});

// DTO for updating a tenant
export const updateTenantDto = createTenantDto
  .partial() // Make all fields optional
  .extend({
    id: z.string(), // ID is required for update
  });

// DTO for tenant ID operations
export const tenantIdDto = z.object({
  id: z.string(),
});

// DTO for assigning tenant to lease
export const assignTenantToLeaseDto = z.object({
  leaseId: z.string(),
  tenantId: z.string(),
  isPrimary: z.boolean().default(true),
});

// Types based on the schemas
export type CreateTenantDto = z.infer<typeof createTenantDto>;
export type UpdateTenantDto = z.infer<typeof updateTenantDto>;
export type TenantIdDto = z.infer<typeof tenantIdDto>;
export type AssignTenantToLeaseDto = z.infer<typeof assignTenantToLeaseDto>;
