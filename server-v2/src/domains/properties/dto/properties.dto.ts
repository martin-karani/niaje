import { z } from "zod";

// DTOs for creating and updating properties
export const createPropertyDto = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  type: z.string().min(2, "Type must be at least 2 characters"),
  description: z.string().optional(),
  caretakerId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

export const updatePropertyDto = createPropertyDto.partial().extend({
  id: z.string(),
});

export const propertyIdDto = z.object({
  id: z.string(),
});

// Types based on the schemas
export type CreatePropertyDto = z.infer<typeof createPropertyDto>;
export type UpdatePropertyDto = z.infer<typeof updatePropertyDto>;
export type PropertyIdDto = z.infer<typeof propertyIdDto>;
