import { teamsService } from "@/domains/organizations/services";
import { userEntity } from "@/domains/users/entities";
import { db } from "@/infrastructure/database";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { SERVER_CONFIG } from "@/shared/constants/enviroment";
import { AuthorizationError, ValidationError } from "@/shared/errors";
import { clearCookie, setCookie } from "@/shared/utils/cookie.utils";
import { eq } from "drizzle-orm";
import {
  EmailChangeDto,
  LoginDto,
  PasswordChangeDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  RegisterDto,
  VerificationDto,
} from "../dto/auth.dto";
import { authService } from "../services/auth.service";
import { invitationService } from "../services/invitation.service";
import { organizationService } from "../services/organization.service";
import { sessionService } from "../services/session.service";

export const authResolvers = {
  Query: {
    /**
     * Validate invitation token
     */
    validateInvitation: async (
      _: any,
      { token }: VerificationDto,
      _context: GraphQLContext
    ) => {
      try {
        const invitation = await invitationService.getInvitationByToken(token);
        return {
          valid: true,
          message: "Invitation is valid",
          invitation: {
            email: invitation.email,
            role: invitation.role,
            organizationName: invitation.organization.name,
            inviterName: invitation.inviter?.name || "Administrator",
            expiresAt: invitation.expiresAt.toISOString(),
          },
        };
      } catch (error) {
        return {
          valid: false,
          message: error.message || "Invalid or expired invitation",
          invitation: null,
        };
      }
    },
    me: async (_: any, __: any, context: GraphQLContext) => {
      // If user is not authenticated, return null
      if (!context.user) {
        return null;
      }

      // Get user organizations
      const organizations = await organizationService.getUserOrganizations(
        context.user.id
      );

      // Get active organization if available
      let activeOrganization = null;
      let activeTeam = null;

      if (context.organization) {
        activeOrganization = context.organization;
        activeTeam = context.team;
      }

      return {
        user: context.user,
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
        })),
        activeOrganization,
        activeTeam,
      };
    },
  },

  Mutation: {
    /**
     * Register a new user
     */
    register: async (
      _: any,
      { input }: { input: RegisterDto },
      context: GraphQLContext
    ) => {
      try {
        const { user, sessionToken } = await authService.register({
          email: input.email,
          password: input.password,
          name: input.name,
        });

        // If verification is required, no session token will be returned
        if (sessionToken) {
          // Set session token in cookie
          setCookie(context.res, "auth_token", sessionToken, {
            httpOnly: true,
            secure: SERVER_CONFIG.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          return {
            user: user,
            token: sessionToken,
          };
        }

        // If email verification is required
        return {
          user: user,
          token: null,
        };
      } catch (error) {
        console.error("Registration error:", error);
        throw error; // Re-throw to be caught by error handler
      }
    },

    /**
     * Login a user
     */
    login: async (
      _: any,
      { input }: { input: LoginDto },
      context: GraphQLContext
    ) => {
      // Get IP and user agent for additional security
      const ipAddress = context.req.ip || null;
      const userAgent = context.req.headers["user-agent"] || null;

      const { user, sessionToken } = await authService.login({
        email: input.email,
        password: input.password,
        ipAddress,
        userAgent,
      });

      // Set session token in cookie
      const maxAge = input.remember
        ? 30 * 24 * 60 * 60 * 1000 // 30 days if "remember me"
        : 7 * 24 * 60 * 60 * 1000; // 7 days default

      setCookie(context.res, "auth_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge,
      });

      // Get user organizations
      const organizations = await organizationService.getUserOrganizations(
        user.id
      );

      // Get active organization if available
      let activeOrganization = null;
      let activeTeam = null;

      const session = await sessionService.getSessionByToken(sessionToken);
      if (session?.data?.activeOrganizationId) {
        try {
          // Load active organization and team
          const org = await organizationService.getOrganizationById(
            session.data.activeOrganizationId
          );

          activeOrganization = {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo,
          };

          // If session has team, get it
          if (session.data.activeTeamId) {
            try {
              const team = await teamsService.getTeamById(
                session.data.activeTeamId
              );
              if (team.organizationId === org.id) {
                activeTeam = {
                  id: team.id,
                  name: team.name,
                };
              }
            } catch (error) {
              console.error("Error getting active team:", error);
            }
          }
        } catch (error) {
          console.error("Error getting active organization:", error);
        }
      }

      return {
        user,
        sessionToken,
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
        })),
        activeOrganization,
        activeTeam,
      };
    },

    /**
     * Logout a user
     */
    logout: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        return true; // Already logged out
      }

      const token = context.req.cookies?.auth_token;

      if (token) {
        await sessionService.deleteSession(token);
        clearCookie(context.res, "auth_token");
      }

      return true;
    },

    /**
     * Request password reset
     */
    requestPasswordReset: async (
      _: any,
      { input }: { input: PasswordResetRequestDto },
      _context: GraphQLContext
    ) => {
      // Always return success to prevent email enumeration
      try {
        await authService.sendPasswordResetEmail(input.email);
      } catch (error) {
        console.error("Error sending password reset email:", error);
      }

      return {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    },

    /**
     * Reset password with token
     */
    resetPassword: async (
      _: any,
      { input }: { input: PasswordResetDto },
      _context: GraphQLContext
    ) => {
      await authService.resetPassword(input.token, input.password);

      return {
        success: true,
        message:
          "Password reset successful. You can now login with your new password.",
      };
    },

    /**
     * Change password (when logged in)
     */
    changePassword: async (
      _: any,
      { input }: { input: PasswordChangeDto },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      if (input.newPassword !== input.confirmPassword) {
        throw new ValidationError("Passwords do not match");
      }

      await authService.changePassword(
        context.user.id,
        input.currentPassword,
        input.newPassword
      );

      return {
        success: true,
        message: "Password changed successfully.",
      };
    },

    /**
     * Verify email with token
     */
    verifyEmail: async (
      _: any,
      { input }: { input: VerificationDto },
      _context: GraphQLContext
    ) => {
      await authService.verifyEmail(input.token);

      return {
        success: true,
        message: "Email verification successful. You can now login.",
      };
    },

    /**
     * Resend verification email
     */
    resendVerificationEmail: async (
      _: any,
      { input }: { input: PasswordResetRequestDto },
      _context: GraphQLContext
    ) => {
      // Always return success to prevent email enumeration
      try {
        const user = await db.query.userEntity.findFirst({
          where: eq(userEntity.email, input.email),
        });

        if (user && !user.emailVerified) {
          await authService.sendEmailVerification(user.id, user.email);
        }
      } catch (error) {
        console.error("Error resending verification email:", error);
      }

      return {
        success: true,
        message:
          "If your email is not verified, a new verification email has been sent.",
      };
    },

    /**
     * Request email change
     */
    requestEmailChange: async (
      _: any,
      { input }: { input: EmailChangeDto },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      await authService.changeEmail(context.user.id, input.newEmail);

      return {
        success: true,
        message: "Email change verification sent to new email address.",
      };
    },

    /**
     * Verify email change with token
     */
    verifyEmailChange: async (
      _: any,
      { input }: { input: VerificationDto },
      _context: GraphQLContext
    ) => {
      await authService.verifyEmailChange(input.token);

      return {
        success: true,
        message: "Email changed successfully.",
      };
    },

    /**
     * Accept invitation (when already registered)
     */
    acceptInvitation: async (
      _: any,
      { token }: { token: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      const { organizationId, teamId } =
        await invitationService.acceptInvitation(token, context.user.id);

      // Update session with new organization
      const authToken = context.req.cookies?.auth_token;
      if (authToken) {
        await sessionService.setActiveOrganization(authToken, organizationId);

        if (teamId) {
          await sessionService.setActiveTeam(authToken, teamId);
        }
      }

      const organization =
        await organizationService.getOrganizationById(organizationId);

      return {
        success: true,
        message: "Organization invitation accepted successfully.",
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
        },
        teamId,
      };
    },

    /**
     * Switch active organization
     */
    switchOrganization: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      // Check if user is a member of this organization
      const isMember = await organizationService.isUserMemberOfOrganization(
        context.user.id,
        id
      );

      if (!isMember) {
        throw new AuthorizationError(
          "You are not a member of this organization"
        );
      }

      // Update session
      const token = context.req.cookies?.auth_token;
      if (token) {
        await sessionService.setActiveOrganization(token, id);
        // Clear any active team when switching orgs
        await sessionService.setActiveTeam(token, null);
      }

      const organization = await organizationService.getOrganizationById(id);

      return {
        success: true,
        message: "Organization switched successfully.",
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
        },
      };
    },

    /**
     * Set active team
     */
    setActiveTeam: async (
      _: any,
      { teamId }: { teamId: string | null },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      if (!context.organization) {
        throw new ValidationError("No active organization selected");
      }

      // Update session
      const token = context.req.cookies?.auth_token;
      if (token) {
        await sessionService.setActiveTeam(token, teamId);
      }

      // If teamId is null, return success with null team
      if (teamId === null) {
        return {
          success: true,
          message: "Active team cleared successfully.",
          team: null,
        };
      }

      // Otherwise fetch team details
      const team = await teamsService.getTeamById(teamId);

      return {
        success: true,
        message: "Active team set successfully.",
        team: {
          id: team.id,
          name: team.name,
        },
      };
    },
  },
};
