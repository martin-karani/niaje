import { z } from "zod";

// DTO for user registration
export const registerDto = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string(),
    name: z.string().min(2, "Name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

// DTO for user login
export const loginDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

// DTO for password reset request
export const forgotPasswordDto = z.object({
  email: z.string().email("Invalid email address"),
});

// DTO for resetting password with token
export const resetPasswordDto = z
  .object({
    token: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// DTO for email verification
export const verifyEmailDto = z.object({
  token: z.string(),
});

// DTO for requesting email change
export const changeEmailDto = z.object({
  newEmail: z.string().email("Invalid email address"),
});

// DTO for accepting organization invitation
export const acceptInvitationDto = z.object({
  token: z.string(),
});

// DTO for signup from invitation (new user)
export const signupFromInvitationDto = z
  .object({
    token: z.string(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// DTO for creating organization
export const createOrganizationDto = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  logo: z.string().optional(),
  address: z.string().optional(),
});

// DTO for switching organization
export const switchOrganizationDto = z.object({
  organizationId: z.string(),
});

// DTO for setting active team
export const setActiveTeamDto = z.object({
  teamId: z.string().nullable(),
});

// Types derived from DTOs
export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;
export type VerifyEmailDto = z.infer<typeof verifyEmailDto>;
export type ChangeEmailDto = z.infer<typeof changeEmailDto>;
export type AcceptInvitationDto = z.infer<typeof acceptInvitationDto>;
export type SignupFromInvitationDto = z.infer<typeof signupFromInvitationDto>;
export type CreateOrganizationDto = z.infer<typeof createOrganizationDto>;
export type SwitchOrganizationDto = z.infer<typeof switchOrganizationDto>;
export type SetActiveTeamDto = z.infer<typeof setActiveTeamDto>;
