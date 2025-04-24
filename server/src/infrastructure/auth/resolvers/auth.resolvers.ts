import { teamsService } from "@/domains/organizations/services";
import { memberEntity, teamEntity } from "@/domains/users/entities";
import { db } from "@/infrastructure/database";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors";
import { clearCookie, setCookie } from "@/shared/utils/cookie.utils";
import { and, eq } from "drizzle-orm";
import { authService } from "../services/auth.service";
import { invitationService } from "../services/invitation.service";
import { organizationService } from "../services/organization.service";
import { sessionService } from "../services/session.service";

export const authResolvers = {
  Query: {
    /**
     * Get current authenticated user with organizations
     */
    me: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      // Get user organizations
      const organizations = await organizationService.getUserOrganizations(
        context.user.id
      );

      return {
        user: context.user,
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
        })),
        activeOrganization: context.organization,
        activeTeam: context.team,
      };
    },

    /**
     * Validate invitation token
     */
    validateInvitation: async (
      _: any,
      { token }: { token: string },
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
  },

  Mutation: {
    /**
     * Register a new user
     */
    register: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      const { email, password, name } = input;

      const { user, sessionToken } = await authService.register({
        email,
        password,
        name,
        requireEmailVerification: true,
      });

      // If verification is required, no session token will be returned
      if (sessionToken) {
        // Set session token in cookie
        setCookie(context.req, "auth_token", sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          },
          sessionToken,
        };
      }

      // If email verification is required
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: false,
        },
        sessionToken: null,
      };
    },

    /**
     * Login a user
     */
    login: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      const { email, password, remember } = input;

      // Get IP and user agent for additional security
      const ipAddress =
        context.req.ip || context.req.socket.remoteAddress || null;
      const userAgent = context.req.headers["user-agent"] || null;

      const { user, sessionToken } = await authService.login({
        email,
        password,
        ipAddress,
        userAgent,
      });

      // Set session token in cookie
      const maxAge = remember
        ? 30 * 24 * 60 * 60 * 1000 // 30 days if "remember me"
        : 7 * 24 * 60 * 60 * 1000; // 7 days default

      setCookie(context.req, "auth_token", sessionToken, {
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
              // Ignore team errors
            }
          }
        } catch (error) {
          // Ignore organization errors
        }
      }

      return {
        user,
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
        clearCookie(context.req, "auth_token");
      }

      return true;
    },

    /**
     * Request password reset
     */
    forgotPassword: async (
      _: any,
      { input }: { input: any },
      _context: GraphQLContext
    ) => {
      const { email } = input;

      // Always return success to prevent email enumeration
      try {
        await authService.sendPasswordResetEmail(email);
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
      { input }: { input: any },
      _context: GraphQLContext
    ) => {
      const { token, password, confirmPassword } = input;

      if (password !== confirmPassword) {
        throw new ValidationError("Passwords do not match");
      }

      await authService.resetPassword(token, password);

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
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      const { currentPassword, newPassword, confirmPassword } = input;

      if (newPassword !== confirmPassword) {
        throw new ValidationError("Passwords do not match");
      }

      await authService.changePassword(
        context.user.id,
        currentPassword,
        newPassword
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
      { input }: { input: any },
      _context: GraphQLContext
    ) => {
      const { token } = input;

      await authService.verifyEmail(token);

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
      { input }: { input: any },
      _context: GraphQLContext
    ) => {
      const { email } = input;

      // Always return success to prevent email enumeration
      try {
        const user = await db.query.userEntity.findFirst({
          where: eq(userEntity.email, email),
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
    changeEmail: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      const { newEmail } = input;

      await authService.changeEmail(context.user.id, newEmail);

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
      { input }: { input: any },
      _context: GraphQLContext
    ) => {
      const { token } = input;

      await authService.verifyEmailChange(token);

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
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      const { token } = input;

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
     * Register and accept invitation (for new users)
     */
    signupFromInvitation: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      const { token, name, password, confirmPassword } = input;

      if (password !== confirmPassword) {
        throw new ValidationError("Passwords do not match");
      }

      const { user, organizationId, sessionToken } =
        await invitationService.signupFromInvitation({
          token,
          name,
          password,
        });

      // Set session token in cookie
      setCookie(context.req, "auth_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        user,
        sessionToken,
      };
    },

    /**
     * Create a new organization
     */
    createOrganization: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      const organization = await organizationService.createOrganization({
        ...input,
        userId: context.user.id,
      });

      // Set as active organization in session
      const token = context.req.cookies?.auth_token;
      if (token) {
        await sessionService.setActiveOrganization(token, organization.id);
      }

      return {
        success: true,
        message: "Organization created successfully.",
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
        },
      };
    },

    /**
     * Switch active organization
     */
    switchOrganization: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      const { organizationId } = input;

      // Check if user is member of this organization
      const isMember = await organizationService.isUserMemberOfOrganization(
        context.user.id,
        organizationId
      );

      if (!isMember) {
        throw new AuthorizationError(
          "You are not a member of this organization"
        );
      }

      // Update session
      const token = context.req.cookies?.auth_token;
      if (token) {
        await sessionService.setActiveOrganization(token, organizationId);
        // Clear any active team when switching orgs
        await sessionService.setActiveTeam(token, null);
      }

      const organization =
        await organizationService.getOrganizationById(organizationId);

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
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }

      if (!context.organization) {
        throw new ValidationError("No active organization selected");
      }

      const { teamId } = input;

      // If setting to null, that's always allowed (removing active team)
      if (teamId === null) {
        // Update session
        const token = context.req.cookies?.auth_token;
        if (token) {
          await sessionService.setActiveTeam(token, null);
        }

        return {
          success: true,
          message: "Active team cleared successfully.",
          team: null,
        };
      }

      // Check if team exists and belongs to active organization
      const team = await db.query.teamEntity.findFirst({
        where: and(
          eq(teamEntity.id, teamId),
          eq(teamEntity.organizationId, context.organization.id)
        ),
      });

      if (!team) {
        throw new NotFoundError("Team not found in current organization");
      }

      // Check if user is a member of this team
      const member = await db.query.memberEntity.findFirst({
        where: and(
          eq(memberEntity.userId, context.user.id),
          eq(memberEntity.organizationId, context.organization.id),
          eq(memberEntity.teamId, teamId)
        ),
      });

      if (!member) {
        throw new AuthorizationError("You are not a member of this team");
      }

      // Update session
      const token = context.req.cookies?.auth_token;
      if (token) {
        await sessionService.setActiveTeam(token, teamId);
      }

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
