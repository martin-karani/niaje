import { z } from "zod";

// Schema for custom permissions matching the database schema
export const customPermissionsSchema = z.object({
  canManageTenants: z.boolean().optional(),
  canManageLeases: z.boolean().optional(),
  canCollectPayments: z.boolean().optional(),
  canViewFinancials: z.boolean().optional(),
  canManageMaintenance: z.boolean().optional(),
  canManageProperties: z.boolean().optional(), // Generally false unless specific need
});

// Input for assigning/updating a permission
export const assignPermissionDto = z
  .object({
    propertyId: z.string().min(1, "Property ID is required"),
    userId: z.string().min(1, "User ID is required"),
    role: z.enum(["caretaker", "agent", "readonly", "custom"], {
      errorMap: () => ({ message: "Invalid role specified" }),
    }),
    customPermissions: customPermissionsSchema.optional(),
  })
  .refine(
    (data) => {
      // If role is 'custom', customPermissions must be provided
      if (data.role === "custom" && !data.customPermissions) {
        return false;
      }
      return true;
    },
    {
      message: "Custom permissions must be provided when role is 'custom'",
      path: ["customPermissions"], // Path of the error
    }
  );

// Input for revoking a permission (using user and property IDs)
export const revokePermissionDto = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

// Input requiring just a property ID
export const propertyIdDto = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
});

// Input requiring just a user ID (might be needed for other user-related lookups)
export const userIdDto = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Infer TypeScript types from schemas
export type AssignPermissionDto = z.infer<typeof assignPermissionDto>;
export type RevokePermissionDto = z.infer<typeof revokePermissionDto>;
export type PropertyIdDto = z.infer<typeof propertyIdDto>;
export type UserIdDto = z.infer<typeof userIdDto>;
export type CustomPermissionsDto = z.infer<typeof customPermissionsSchema>;
