import {
  invitationEntity,
  memberEntity,
  organizationEntity,
  type Invitation,
} from "@/domains/organizations/entities";
import { userEntity } from "@/domains/users/entities/user.entity";
import { db } from "@/infrastructure/database";
import emailService from "@/infrastructure/email/email.service";
import { NotFoundError, ValidationError } from "@/shared/errors";
import { generateToken } from "@/shared/utils/auth.utils";
import { addDays } from "date-fns";
import { and, eq } from "drizzle-orm";
import { authService } from "./auth.service";
import { sessionService } from "./session.service";

export class InvitationService {
  /**
   * Create a new invitation
   */
  async createInvitation(data: {
    email: string;
    role: string;
    organizationId: string;
    inviterId: string;
    teamId?: string;
  }): Promise<{ id: string; token: string }> {
    // Normalize email
    const email = data.email.toLowerCase();

    // Check if organization exists
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, data.organizationId),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    // Check if inviter exists
    const inviter = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, data.inviterId),
    });

    if (!inviter) {
      throw new NotFoundError("Inviter not found");
    }

    // Check if invitation already exists
    const existingInvitation = await db.query.invitationEntity.findFirst({
      where: and(
        eq(invitationEntity.email, email),
        eq(invitationEntity.organizationId, data.organizationId),
        eq(invitationEntity.status, "pending")
      ),
    });

    if (existingInvitation) {
      // Update existing invitation
      const token = generateToken();
      const expiresAt = addDays(new Date(), 7); // 7 days expiry

      await db
        .update(invitationEntity)
        .set({
          role: data.role,
          token,
          expiresAt,
          inviterId: data.inviterId,
          updatedAt: new Date(),
        })
        .where(eq(invitationEntity.id, existingInvitation.id));

      // Send invitation email
      await this.sendInvitationEmail({
        email,
        inviterName: inviter.name || inviter.email,
        inviterEmail: inviter.email,
        organizationName: organization.name,
        token,
        role: data.role,
      });

      return { id: existingInvitation.id, token };
    }

    // Create new invitation
    const token = generateToken();
    const expiresAt = addDays(new Date(), 7); // 7 days expiry

    const [invitation] = await db
      .insert(invitationEntity)
      .values({
        email,
        role: data.role,
        organizationId: data.organizationId,
        status: "pending",
        token,
        inviterId: data.inviterId,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        teamId: data.teamId,
      })
      .returning();

    // Send invitation email
    await this.sendInvitationEmail({
      email,
      inviterName: inviter.name || inviter.email,
      inviterEmail: inviter.email,
      organizationName: organization.name,
      token,
      role: data.role,
    });

    return { id: invitation.id, token };
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(
    id: string,
    organizationId: string
  ): Promise<Invitation> {
    // Check if invitation exists
    const invitation = await db.query.invitationEntity.findFirst({
      where: and(
        eq(invitationEntity.id, id),
        eq(invitationEntity.organizationId, organizationId)
      ),
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    // Update invitation status
    const [updatedInvitation] = await db
      .update(invitationEntity)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(invitationEntity.id, id))
      .returning();

    return updatedInvitation;
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    id: string,
    organizationId: string
  ): Promise<Invitation> {
    // Check if invitation exists
    const invitation = await db.query.invitationEntity.findFirst({
      where: and(
        eq(invitationEntity.id, id),
        eq(invitationEntity.organizationId, organizationId)
      ),
      with: {
        organization: true,
        inviter: true,
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new ValidationError("Invitation is not pending");
    }

    // Generate new token and update expiry
    const token = generateToken();
    const expiresAt = addDays(new Date(), 7); // 7 days expiry

    const [updatedInvitation] = await db
      .update(invitationEntity)
      .set({
        token,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(invitationEntity.id, id))
      .returning();

    // Send invitation email
    await this.sendInvitationEmail({
      email: invitation.email,
      inviterName:
        invitation.inviter?.name ||
        invitation.inviter?.email ||
        "Administrator",
      inviterEmail: invitation.inviter?.email || "admin@example.com",
      organizationName: invitation.organization.name,
      token,
      role: invitation.role,
    });

    return updatedInvitation;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation> {
    const invitation = await db.query.invitationEntity.findFirst({
      where: eq(invitationEntity.token, token),
      with: {
        organization: true,
        inviter: true,
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found or expired");
    }

    if (invitation.status !== "pending") {
      throw new ValidationError(`Invitation has been ${invitation.status}`);
    }

    if (invitation.expiresAt < new Date()) {
      await db
        .update(invitationEntity)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(invitationEntity.id, invitation.id));

      throw new ValidationError("Invitation has expired");
    }

    return invitation;
  }

  /**
   * Get invitations for an organization
   */
  async getOrganizationInvitations(
    organizationId: string
  ): Promise<Invitation[]> {
    return db.query.invitationEntity.findMany({
      where: eq(invitationEntity.organizationId, organizationId),
      with: {
        inviter: true,
      },
      orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
    });
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<{ organizationId: string; teamId: string | null }> {
    // Get invitation
    const invitation = await this.getInvitationByToken(token);

    // Check if user exists
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if user email matches invitation email
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ValidationError(
        "The invitation was sent to a different email address"
      );
    }

    // Check if user is already a member
    const existingMember = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, invitation.organizationId)
      ),
    });

    if (existingMember) {
      if (existingMember.status === "active") {
        throw new ValidationError(
          "You are already a member of this organization"
        );
      }

      // Update existing member
      await db
        .update(memberEntity)
        .set({
          status: "active",
          role: invitation.role,
          teamId: invitation.teamId,
          joinedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(memberEntity.id, existingMember.id));
    } else {
      // Create new member
      await db.insert(memberEntity).values({
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        status: "active",
        teamId: invitation.teamId,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update invitation status
    await db
      .update(invitationEntity)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(invitationEntity.id, invitation.id));

    // Return organization and team IDs for switching context
    return {
      organizationId: invitation.organizationId,
      teamId: invitation.teamId,
    };
  }

  /**
   * Handle signup from invitation (when user doesn't exist yet)
   */
  async signupFromInvitation(data: {
    token: string;
    name: string;
    password: string;
  }): Promise<{ user: any; organizationId: string; sessionToken: string }> {
    // Get invitation
    const invitation = await this.getInvitationByToken(data.token);

    // Check if user with this email already exists
    const existingUser = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, invitation.email),
    });

    if (existingUser) {
      throw new ValidationError(
        "A user with this email already exists. Please log in and then accept the invitation."
      );
    }

    // Create new user
    const { user } = await authService.register({
      email: invitation.email,
      name: data.name,
      password: data.password,
      role: invitation.role === "owner" ? "agent_owner" : "agent_staff",
      requireEmailVerification: false, // Skip email verification for invited users
    });

    // Create session
    const sessionToken = await sessionService.createSession({
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      data: {},
    });

    // Accept invitation
    const { organizationId } = await this.acceptInvitation(data.token, user.id);

    // Update session with organization
    await sessionService.setActiveOrganization(sessionToken, organizationId);

    return { user, organizationId, sessionToken };
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(data: {
    email: string;
    inviterName: string;
    inviterEmail: string;
    organizationName: string;
    token: string;
    role: string;
  }): Promise<void> {
    const inviteUrl = `${process.env.FRONTEND_URL}/invitation/accept?token=${data.token}`;

    await emailService.sendOrganizationInvitationEmail(
      data.email,
      data.organizationName,
      data.inviterName,
      data.token,
      data.role
    );
  }
}

export const invitationService = new InvitationService();
