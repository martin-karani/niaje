import { z } from "zod";
import {
  maintenanceCategoryEnum,
  maintenancePriorityEnum,
  maintenanceStatusEnum,
} from "../entities/maintenance-request.entity";

// DTO for creating a maintenance request
export const createMaintenanceRequestDto = z.object({
  propertyId: z.string(),
  unitId: z.string().optional().nullable(), // Optional - not all requests are unit-specific
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  priority: z.enum(maintenancePriorityEnum.enumValues).default("medium"),
  category: z.enum(maintenanceCategoryEnum.enumValues).optional(),
  reportedBy: z.string(), // User ID who reported issue
  permissionToEnter: z.boolean().default(false),
  preferredAvailability: z.string().optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),
  scheduledDate: z.string().optional().nullable(), // Date string, will convert to Date
  imageUrls: z.array(z.string()).optional(), // Array of image URLs
  organizationId: z.string(), // Required on creation, likely from context
});

// DTO for updating a maintenance request
export const updateMaintenanceRequestDto = z.object({
  id: z.string(),
  status: z.enum(maintenanceStatusEnum.enumValues).optional(),
  priority: z.enum(maintenancePriorityEnum.enumValues).optional(),
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .optional(),
  assignedTo: z.string().optional().nullable(), // User ID to assign to
  scheduledDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  actualCost: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  imagesAfter: z.array(z.string()).optional(),
  vendor: z.string().optional().nullable(),
});

// DTO for maintenance request ID operations
export const maintenanceRequestIdDto = z.object({
  id: z.string(),
});

// DTO for assigning a maintenance request
export const assignMaintenanceRequestDto = z.object({
  id: z.string(),
  assigneeId: z.string(),
});

// Types based on the schemas
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
