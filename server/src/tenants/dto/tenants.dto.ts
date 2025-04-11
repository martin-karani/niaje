import { z } from "zod";

export const createTenantDto = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  dateOfBirth: z.date().optional().nullable(),
  status: z.enum(["active", "past", "blacklisted"]).default("active"),
  documents: z.any().optional().nullable(),
});

export const updateTenantDto = createTenantDto.partial().extend({
  id: z.string(),
});

export const tenantIdDto = z.object({
  id: z.string(),
});

export const tenantFilterDto = z.object({
  propertyId: z.string().optional(),
  status: z.enum(["active", "past", "blacklisted"]).optional(),
  search: z.string().optional(),
});

// Types based on schemas
export type CreateTenantDto = z.infer<typeof createTenantDto>;
export type UpdateTenantDto = z.infer<typeof updateTenantDto>;
export type TenantIdDto = z.infer<typeof tenantIdDto>;
export type TenantFilterDto = z.infer<typeof tenantFilterDto>;
