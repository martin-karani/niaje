import { emailService } from "@domains/communications/services/email.service";
import { db } from "@infrastructure/database";
import { createId } from "@infrastructure/database/utils/id-generator";
import { NotFoundError } from "@shared/errors/not-found.error";
import { ValidationError } from "@shared/errors/validation.error";
import { generateToken } from "@shared/utils/auth.utils";
import { addDays } from "date-fns";
import { and, eq } from "drizzle-orm";
import {
  Invitation,
  NewInvitation,
  NewMember,
  invitationEntity,
  memberEntity,
  organizationEntity,
} from "../entities/organization.entity";

export class InvitationsService {
  /**
   * Get all invitations for an organization
   */
  async getOrganizationInvitations(
    organizationId: string
  ): Promise<Invitation[]> {
    return db.query.invitationEntity.findMany({
      where: eq(invitationEntity.organizationId, organizationId),
      with: {
        organization: true,
        inviter: true,
      },
    });
  }

  /**
   * Get invitation by ID
   */
  async getInvitationById(id: string): Promise<Invitation> {
    const invitation = await db.query.invitationEntity.findFirst({
      where: eq(invitationEntity.id, id),
      with: {
        organization: true,
        inviter: true,
      },
    });

    if (!invitation) {
      throw new NotFoundError(`Invitation with ID ${id} not found`);
    }

    return invitation;
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
      throw new NotFoundError(`Invitation with token ${token} not found`);
    }

    return invitation;
  }

  /**
   * Create a new invitation
   */
  async createInvitation(data: {
    email: string;
    role: string;
    organizationId: string;
    inviterId: string;
    teamId?: string;
  }): Promise<Invitation> {
    // Check if organization exists
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, data.organizationId),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    // Check if invitation already exists
    const existingInvitation = await db.query.invitationEntity.findFirst({
      where: and(
        eq(invitationEntity.email, data.email),
        eq(invitationEntity.organizationId, data.organizationId),
        eq(invitationEntity.status, "pending")
      ),
    });

    if (existingInvitation) {
      throw new ValidationError(
        "An active invitation already exists for this email"
      );
    }

    // Generate invitation token
    const token = generateToken();

    // Create expiration date (7 days from now)
    const expiresAt = addDays(new Date(), 7);

    // Create invitation
    const invitationData: NewInvitation = {
      id: createId(),
      organizationId: data.organizationId,
      email: data.email,
      role: data.role,
      status: "pending",
      token,
      expiresAt,
      inviterId: data.inviterId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [invitation] = await db
      .insert(invitationEntity)
      .values(invitationData)
      .returning();

    // Get organization and inviter details for email
    const inviter = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, data.inviterId),
    });

    // Send invitation email
    if (inviter) {
      try {
        await emailService.sendOrganizationInvitationEmail(
          data.email,
          organization.name,
          inviter.name,
          token,
          data.role
        );
      } catch (error) {
        console.error("Failed to send invitation email:", error);
      }
    }

    return invitation;
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(
    id: string,
    organizationId: string
  ): Promise<Invitation> {
    // Check if invitation exists and belongs to organization
    const invitation = await db.query.invitationEntity.findFirst({
      where: and(
        eq(invitationEntity.id, id),
        eq(invitationEntity.organizationId, organizationId)
      ),
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    // Only pending invitations can be revoked
    if (invitation.status !== "pending") {
      throw new ValidationError("Only pending invitations can be revoked");
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
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<void> {
    // Find invitation by token
    const invitation = await this.getInvitationByToken(token);

    // Check if invitation is still valid
    if (invitation.status !== "pending") {
      throw new ValidationError(
        `Invalid invitation status: ${invitation.status}`
      );
    }

    if (new Date() > invitation.expiresAt) {
      throw new ValidationError("Invitation has expired");
    }

    // Check if user is already a member of the organization
    const existingMembership = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, invitation.organizationId)
      ),
    });

    if (existingMembership) {
      throw new ValidationError(
        "You are already a member of this organization"
      );
    }

    // Create organization membership
    const membershipData: NewMember = {
      id: createId(),
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
      status: "active",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.transaction(async (tx) => {
      // Create membership
      await tx.insert(memberEntity).values(membershipData);

      // Update invitation status
      await tx
        .update(invitationEntity)
        .set({
          status: "accepted",
          updatedAt: new Date(),
        })
        .where(eq(invitationEntity.id, invitation.id));
    });
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(
    id: string,
    organizationId: string
  ): Promise<Invitation> {
    // Check if invitation exists and belongs to organization
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

    // Only pending invitations can be resent
    if (invitation.status !== "pending") {
      throw new ValidationError("Only pending invitations can be resent");
    }

    // Generate new token and update expiration date
    const token = generateToken();
    const expiresAt = addDays(new Date(), 7);

    // Update invitation
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
    if (invitation.inviter && invitation.organization) {
      try {
        await emailService.sendOrganizationInvitationEmail(
          invitation.email,
          invitation.organization.name,
          invitation.inviter.name,
          token,
          invitation.role
        );
      } catch (error) {
        console.error("Failed to send invitation email:", error);
      }
    }

    return updatedInvitation;
  }
}

// Export singleton instance
export const invitationsService = new InvitationsService();
