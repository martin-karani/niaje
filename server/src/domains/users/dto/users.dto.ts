import { z } from "zod";
import { userRoleEnum } from "../entities";

// Base user input schema
const userBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
});

// DTO for creating a user (unified schema for all creation flows)
export const createUserDto = userBaseSchema
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string(),
    role: z.enum(userRoleEnum.enumValues).default("agent_staff"),
    isActive: z.boolean().default(true),
    emailVerified: z.boolean().default(false),

    // Optional fields for special creation flows
    organizationId: z.string().optional(),
    tenantId: z.string().optional(),
    sendCredentials: z.boolean().default(true),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

// DTO for updating a user
export const updateUserDto = userBaseSchema.partial().extend({
  id: z.string(),
  role: z.enum(userRoleEnum.enumValues).optional(),
  isActive: z.boolean().optional(),
});

// DTO for user ID operations
export const userIdDto = z.object({
  id: z.string(),
});

// Types based on the schemas
export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type UserIdDto = z.infer<typeof userIdDto>;
