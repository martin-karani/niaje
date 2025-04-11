import { z } from "zod";

// Define enums for validation
const priorityEnum = z.enum(["low", "medium", "high", "emergency"]);
const statusEnum = z.enum([
  "open",
  "in_progress",
  "completed",
  "closed",
  "cancelled",
]);

// Base schema for creating and updating maintenance requests
const maintenanceRequestBaseSchema = {
  unitId: z.string().min(1, "Unit ID is required"),
  tenantId: z.string().nullish(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: priorityEnum.default("medium"),
  cost: z.number().nullish(),
  images: z.any().optional().nullish(), // This should be refined based on your file handling approach
  notes: z.string().optional().nullish(),
};

// DTO for creating a new maintenance request
export const createMaintenanceRequestDto = z.object({
  ...maintenanceRequestBaseSchema,
});

// DTO for updating an existing maintenance request
export const updateMaintenanceRequestDto = z.object({
  id: z.string(),
  ...Object.entries(maintenanceRequestBaseSchema).reduce(
    (acc, [key, validator]) => ({
      ...acc,
      [key]:
        validator instanceof z.ZodBoolean
          ? validator.optional()
          : validator.optional(),
    }),
    {}
  ),
  status: statusEnum.optional(),
  assignedTo: z.string().nullish(),
  resolvedAt: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .nullish(),
});

// DTO for maintenance request ID parameter
export const maintenanceRequestIdDto = z.object({
  id: z.string().min(1, "Maintenance request ID is required"),
});

// DTO for assigning a maintenance request
export const assignMaintenanceRequestDto = z.object({
  id: z.string().min(1, "Maintenance request ID is required"),
  assignedTo: z.string().min(1, "User ID to assign is required"),
  notes: z.string().optional(),
});

// DTO for resolving a maintenance request
export const resolveMaintenanceRequestDto = z.object({
  id: z.string().min(1, "Maintenance request ID is required"),
  cost: z.number().optional(),
  notes: z.string().optional(),
  resolution: z.string().min(1, "Resolution details are required"),
});

// DTO for maintenance comment
export const createMaintenanceCommentDto = z.object({
  requestId: z.string().min(1, "Maintenance request ID is required"),
  content: z.string().min(1, "Comment content is required"),
  isPrivate: z.boolean().default(false),
});

// DTO for filtering maintenance requests
export const maintenanceRequestFilterDto = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  dateTo: z
    .date()
    .or(z.string().transform((str) => new Date(str)))
    .optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

// DTO for maintenance categories
export const createMaintenanceCategoryDto = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullish(),
  isCommon: z.boolean().default(true),
});

// DTO for maintenance report
export const generateMaintenanceReportDto = z.object({
  propertyId: z.string().optional(),
  dateFrom: z.date().or(z.string().transform((str) => new Date(str))),
  dateTo: z.date().or(z.string().transform((str) => new Date(str))),
  includeDetails: z.boolean().default(false),
  groupBy: z
    .enum(["property", "priority", "status", "category"])
    .default("property"),
});

// Export TypeScript types
export type CreateMaintenanceRequestDto = z.infer<
  typeof createMaintenanceRequestDto
>;
export type UpdateMaintenanceRequestDto = z.infer<
  typeof updateMaintenanceRequestDto
>;
export type MaintenanceRequestIdDto = z.infer<typeof maintenanceRequestIdDto>;
export type AssignMaintenanceRequestDto = z.infer<
  typeof assignMaintenanceRequestDto
>;
export type ResolveMaintenanceRequestDto = z.infer<
  typeof resolveMaintenanceRequestDto
>;
export type CreateMaintenanceCommentDto = z.infer<
  typeof createMaintenanceCommentDto
>;
export type MaintenanceRequestFilterDto = z.infer<
  typeof maintenanceRequestFilterDto
>;
export type CreateMaintenanceCategoryDto = z.infer<
  typeof createMaintenanceCategoryDto
>;
export type GenerateMaintenanceReportDto = z.infer<
  typeof generateMaintenanceReportDto
>;
