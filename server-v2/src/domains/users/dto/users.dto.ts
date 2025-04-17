import { z } from "zod";
import { userRoleEnum } from "../entities/user.entity";

// DTO for creating a user
export const createUserDto = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string(),
    role: z.enum(userRoleEnum.enumValues).default("agent_staff"),
    phone: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

// DTO for updating a user
export const updateUserDto = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(userRoleEnum.enumValues).optional(),
  phone: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// DTO for changing password
export const changePasswordDto = z
  .object({
    id: z.string(),
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// DTO for user ID operations
export const userIdDto = z.object({
  id: z.string(),
});

// DTO for creating a tenant user
export const createTenantUserDto = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  tenantId: z.string(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  sendCredentials: z.boolean().default(true),
});

// Types based on the schemas
export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type ChangePasswordDto = z.infer<typeof changePasswordDto>;
export type UserIdDto = z.infer<typeof userIdDto>;
export type CreateTenantUserDto = z.infer<typeof createTenantUserDto>;
