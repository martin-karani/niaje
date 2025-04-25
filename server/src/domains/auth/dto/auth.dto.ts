import { userRoleEnum } from "@/domains/users/entities";
import { z } from "zod";

// DTO for user login
export const loginDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

// DTO for user registration
export const registerDto = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string().min(1, "Password confirmation is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(userRoleEnum.enumValues).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

// DTO for password reset request
export const passwordResetRequestDto = z.object({
  email: z.string().email("Invalid email address"),
});

// DTO for resetting password with token
export const passwordResetDto = z
  .object({
    token: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// DTO for changing password when logged in
export const passwordChangeDto = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// DTO for email verification and token-based operations
export const verificationDto = z.object({
  token: z.string(),
});

// DTO for requesting email change
export const emailChangeDto = z.object({
  newEmail: z.string().email("Invalid email address"),
});

// DTO for accepting organization invitation
export const acceptInvitationDto = z.object({
  token: z.string(),
});

// DTO for switching organization
export const switchOrganizationDto = z.object({
  id: z.string(),
});

// DTO for setting active team
export const setActiveTeamDto = z.object({
  teamId: z.string().nullable(),
});

// Types derived from DTOs
export type LoginDto = z.infer<typeof loginDto>;
export type PasswordResetRequestDto = z.infer<typeof passwordResetRequestDto>;
export type PasswordResetDto = z.infer<typeof passwordResetDto>;
export type PasswordChangeDto = z.infer<typeof passwordChangeDto>;
export type VerificationDto = z.infer<typeof verificationDto>;
export type EmailChangeDto = z.infer<typeof emailChangeDto>;
export type AcceptInvitationDto = z.infer<typeof acceptInvitationDto>;
export type SwitchOrganizationDto = z.infer<typeof switchOrganizationDto>;
export type SetActiveTeamDto = z.infer<typeof setActiveTeamDto>;
export type RegisterDto = z.infer<typeof registerDto>;
