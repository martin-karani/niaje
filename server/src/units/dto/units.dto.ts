import { z } from "zod";

// Unit status enum for validation
export const UnitStatusEnum = z.enum([
  "vacant",
  "occupied",
  "maintenance",
  "reserved",
  "unavailable",
]);

// Common unit schema for reusability
const unitBaseSchema = {
  propertyId: z.string().min(1, "Property ID is required"),
  name: z.string().min(1, "Unit name is required"),
  type: z.string().min(1, "Unit type is required"),
  bedrooms: z.number().int().min(0).default(1),
  bathrooms: z.number().min(0).default(1),
  size: z.number().min(0).optional(),
  rent: z.number().min(0),
  depositAmount: z.number().min(0),
  status: UnitStatusEnum.default("vacant"),
  features: z.any().optional(),
  images: z.any().optional(),
  notes: z.string().optional().nullable(),
};

// DTO for creating a new unit
export const createUnitDto = z.object({
  ...unitBaseSchema,
});

// DTO for updating a unit
export const updateUnitDto = z.object({
  id: z.string(),
  ...Object.entries(unitBaseSchema).reduce(
    (acc, [key, validator]) => ({
      ...acc,
      [key]:
        validator instanceof z.ZodBoolean
          ? validator.optional()
          : validator.optional(),
    }),
    {}
  ),
});

// DTO for unit ID parameter
export const unitIdDto = z.object({
  id: z.string(),
});

// DTO for filtering units
export const unitFilterDto = z.object({
  propertyId: z.string().optional(),
  status: UnitStatusEnum.optional(),
  minBedrooms: z.number().optional(),
  maxBedrooms: z.number().optional(),
  minBathrooms: z.number().optional(),
  maxBathrooms: z.number().optional(),
  minRent: z.number().optional(),
  maxRent: z.number().optional(),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  sortBy: z
    .enum(["name", "rent", "size", "bedrooms"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Type definitions
export type CreateUnitDto = z.infer<typeof createUnitDto>;
export type UpdateUnitDto = z.infer<typeof updateUnitDto>;
export type UnitIdDto = z.infer<typeof unitIdDto>;
export type UnitFilterDto = z.infer<typeof unitFilterDto>;
export type UnitStatus = z.infer<typeof UnitStatusEnum>;
