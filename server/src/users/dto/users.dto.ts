import { z } from "zod";

// User roles enum matching your database schema
export const UserRoleEnum = z.enum(["LANDLORD", "CARETAKER", "AGENT", "ADMIN"]);

// Common user schema for reusability
const userBaseSchema = {
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: UserRoleEnum,
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  emailVerified: z.boolean().optional().default(false),
};

// DTO for creating a new user
export const createUserDto = z.object({
  ...userBaseSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// DTO for admin creating a user (with more fields)
export const adminCreateUserDto = createUserDto.extend({
  sendInvite: z.boolean().optional().default(true),
});

// DTO for updating a user
export const updateUserDto = z.object({
  id: z.string(),
  ...Object.entries(userBaseSchema).reduce(
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

// DTO for updating own profile (limited fields)
export const updateProfileDto = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

// DTO for changing password
export const changePasswordDto = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// DTO for admin changing a user's password
export const adminChangePasswordDto = z.object({
  userId: z.string(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// DTO for user ID parameter
export const userIdDto = z.object({
  id: z.string(),
});

// DTO for filtering users
export const userFilterDto = z.object({
  role: UserRoleEnum.optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

// Export TypeScript types
export type CreateUserDto = z.infer<typeof createUserDto>;
export type AdminCreateUserDto = z.infer<typeof adminCreateUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
export type ChangePasswordDto = z.infer<typeof changePasswordDto>;
export type AdminChangePasswordDto = z.infer<typeof adminChangePasswordDto>;
export type UserIdDto = z.infer<typeof userIdDto>;
export type UserFilterDto = z.infer<typeof userFilterDto>;
export type UserRole = z.infer<typeof UserRoleEnum>;
