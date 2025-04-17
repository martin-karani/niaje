import { z } from "zod";
import {
  inspectionStatusEnum,
  inspectionTypeEnum,
} from "../entities/inspection.entity";

// DTO for creating an inspection
export const createInspectionDto = z.object({
  propertyId: z.string(),
  unitId: z.string().optional().nullable(),
  leaseId: z.string().optional().nullable(),
  type: z.enum(inspectionTypeEnum.enumValues),
  scheduledDate: z.string(), // Date string, will convert to Date
  inspectorId: z.string().optional().nullable(), // User who will perform the inspection
  summary: z.string().optional().nullable(),
  conditionRating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  findings: z
    .array(
      z.object({
        area: z.string(),
        item: z.string(),
        condition: z.string(),
        notes: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
      })
    )
    .optional()
    .nullable(),
  organizationId: z.string(), // Required on creation, likely from context
});

// DTO for updating an inspection
export const updateInspectionDto = z.object({
  id: z.string(),
  status: z.enum(inspectionStatusEnum.enumValues).optional(),
  scheduledDate: z.string().optional(), // Date string
  completedDate: z.string().optional().nullable(), // Date string
  inspectorId: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  conditionRating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  findings: z
    .array(
      z.object({
        area: z.string(),
        item: z.string(),
        condition: z.string(),
        notes: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
      })
    )
    .optional()
    .nullable(),
  tenantSignature: z.string().optional().nullable(),
  inspectorSignature: z.string().optional().nullable(),
});

// DTO for marking an inspection as completed
export const completeInspectionDto = z.object({
  id: z.string(),
  summary: z.string(),
  conditionRating: z.number().int().min(1).max(5),
  notes: z.string().optional().nullable(),
  findings: z.array(
    z.object({
      area: z.string(),
      item: z.string(),
      condition: z.string(),
      notes: z.string().optional().nullable(),
      photoUrl: z.string().optional().nullable(),
    })
  ),
  tenantSignature: z.string().optional().nullable(),
  inspectorSignature: z.string(),
  completedDate: z.string().optional(), // Date string, defaults to now
});

// DTO for inspection ID operations
export const inspectionIdDto = z.object({
  id: z.string(),
});

// Types based on the schemas
export type CreateInspectionDto = z.infer<typeof createInspectionDto>;
export type UpdateInspectionDto = z.infer<typeof updateInspectionDto>;
export type CompleteInspectionDto = z.infer<typeof completeInspectionDto>;
export type InspectionIdDto = z.infer<typeof inspectionIdDto>;
