// src/infrastructure/auth/services/organization.service.ts
import {
  invitationEntity,
  memberEntity,
  organizationEntity,
  teamEntity,
} from "@/domains/organizations/entities";
import { userEntity } from "@/domains/users/entities";
import { db } from "@/infrastructure/database";
import { createId } from "@/infrastructure/database/utils/id-generator";
import { emailService } from "@/infrastructure/email/email.service";
import { SERVER_CONFIG } from "@/shared/constants/enviroment";
import { TRIAL_DAYS } from "@/shared/constants/subscription-plans";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { ValidationError } from "@/shared/errors/validation.error";
import { generateToken } from "@/shared/utils/auth.utils";
import { addDays } from "date-fns";
import { and, eq, ne } from "drizzle-orm";

/**
 * Organization management service
 * Handles organizations, teams, members, and invitations
 */
export class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(data: {
    name: string;
    slug?: string;
    userId: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    logo?: string;
    address?: string;
  }) {
    // Get user to verify they exist
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, data.userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Generate slug if not provided
    const slug = data.slug || this.generateSlug(data.name);

    // Check if slug is available
    const existingOrg = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
    });

    if (existingOrg) {
      throw new ValidationError("Organization slug already in use");
    }

    // Calculate trial expiration date
    const trialExpiresAt = addDays(new Date(), TRIAL_DAYS);

    // Create organization
    const [organization] = await db
      .insert(organizationEntity)
      .values({
        id: createId(),
        name: data.name,
        slug,
        agentOwnerId: data.userId,
        trialStatus: "active",
        trialStartedAt: new Date(),
        trialExpiresAt,
        subscriptionStatus: "trialing",
        maxProperties: 5, // Default trial limits
        maxUsers: 3,
        timezone: data.timezone || "UTC",
        currency: data.currency || "USD",
        dateFormat: data.dateFormat || "MM/dd/yyyy",
        logo: data.logo,
        address: data.address,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Add creator as owner member
    const [member] = await db
      .insert(memberEntity)
      .values({
        id: createId(),
        organizationId: organization.id,
        userId: data.userId,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send welcome email
    try {
      await emailService.sendTrialWelcomeEmail(
        user.email,
        user.name,
        organization.name,
        organization.trialExpiresAt
      );
    } catch (error) {
      console.error("Error sending welcome email:", error);
      // Continue even if email fails
    }

    return { organization, member };
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string) {
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, id),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string) {
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: string,
    data: {
      name?: string;
      slug?: string;
      timezone?: string;
      currency?: string;
      dateFormat?: string;
      logo?: string;
      address?: string;
    }
  ) {
    // Check if organization exists
    const existingOrg = await this.getOrganizationById(id);

    // Check if slug is changing and if it's available
    if (data.slug && data.slug !== existingOrg.slug) {
      const slugExists = await db.query.organizationEntity.findFirst({
        where: and(
          eq(organizationEntity.slug, data.slug),
          ne(organizationEntity.id, id)
        ),
      });

      if (slugExists) {
        throw new ValidationError("Organization slug already in use");
      }
    }

    // Update organization
    const [organization] = await db
      .update(organizationEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, id))
      .returning();

    return organization;
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string) {
    // Check if organization exists
    await this.getOrganizationById(id);

    // Delete organization and all related data (cascade will handle relations)
    await db.delete(organizationEntity).where(eq(organizationEntity.id, id));

    return true;
  }

  /**
   * Get organizations for user
   */
  async getUserOrganizations(userId: string) {
    const members = await db.query.memberEntity.findMany({
      where: eq(memberEntity.userId, userId),
      with: {
        organization: true,
      },
    });

    return members.map((member) => member.organization);
  }

  /**
   * Check if user is member of organization
   */
  async isUserMemberOfOrganization(userId: string, organizationId: string) {
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    return !!member;
  }

  /**
   * Get member role in organization
   */
  async getUserRoleInOrganization(userId: string, organizationId: string) {
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    return member ? member.role : null;
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string) {
    return db.query.memberEntity.findMany({
      where: eq(memberEntity.organizationId, organizationId),
      with: {
        user: true,
        team: true,
      },
    });
  }

  /**
   * Invite user to organization
   */
  async inviteToOrganization(data: {
    organizationId: string;
    email: string;
    role: string;
    inviterId: string;
    teamId?: string;
  }) {
    // Check if organization exists
    await this.getOrganizationById(data.organizationId);

    // Check if inviter is a member of the organization with appropriate permissions
    const inviterRole = await this.getUserRoleInOrganization(
      data.inviterId,
      data.organizationId
    );

    if (!inviterRole || !["owner", "admin"].includes(inviterRole)) {
      throw new AuthorizationError(
        "You do not have permission to invite members"
      );
    }

    // Check if team exists (if provided)
    if (data.teamId) {
      const team = await db.query.teamEntity.findFirst({
        where: and(
          eq(teamEntity.id, data.teamId),
          eq(teamEntity.organizationId, data.organizationId)
        ),
      });

      if (!team) {
        throw new NotFoundError("Team not found in this organization");
      }
    }

    // Check if invitation already exists
    let invitation = await db.query.invitationEntity.findFirst({
      where: and(
        eq(invitationEntity.organizationId, data.organizationId),
        eq(invitationEntity.email, data.email),
        ne(invitationEntity.status, "accepted"),
        ne(invitationEntity.status, "revoked")
      ),
    });

    if (invitation) {
      // Update existing invitation
      [invitation] = await db
        .update(invitationEntity)
        .set({
          role: data.role,
          inviterId: data.inviterId,
          status: "pending",
          expiresAt: addDays(new Date(), 7), // 7 days
          updatedAt: new Date(),
        })
        .where(eq(invitationEntity.id, invitation.id))
        .returning();
    } else {
      // Create new invitation
      const token = generateToken(32);

      [invitation] = await db
        .insert(invitationEntity)
        .values({
          id: createId(),
          organizationId: data.organizationId,
          email: data.email,
          role: data.role,
          status: "pending",
          token,
          teamId: data.teamId,
          inviterId: data.inviterId,
          expiresAt: addDays(new Date(), 7), // 7 days
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }

    // Send invitation email
    const inviter = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, data.inviterId),
    });

    const organization = await this.getOrganizationById(data.organizationId);

    try {
      // Generate invitation URL
      const inviteUrl = `${SERVER_CONFIG.FRONTEND_URL}/invitation/accept?token=${invitation.token}`;

      await emailService.sendOrganizationInvitationEmail(
        data.email,
        organization.name,
        inviter?.name || "A team member",
        invitation.token,
        data.role
      );
    } catch (error) {
      console.error("Error sending invitation email:", error);
      // Continue even if email fails
    }

    return invitation;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string) {
    const invitation = await db.query.invitationEntity.findFirst({
      where: eq(invitationEntity.token, token),
      with: {
        organization: true,
        inviter: true,
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    return invitation;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userId: string) {
    // Find invitation
    const invitation = await this.getInvitationByToken(token);

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      throw new ValidationError("Invitation has expired");
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      throw new ValidationError(`Invitation has been ${invitation.status}`);
    }

    // Get user
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if user email matches invitation email (case insensitive)
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ValidationError("User email does not match invitation email");
    }

    // Check if user is already a member of the organization
    const existingMember = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, invitation.organizationId)
      ),
    });

    if (existingMember) {
      // Update existing membership if role is different
      if (existingMember.role !== invitation.role) {
        await db
          .update(memberEntity)
          .set({
            role: invitation.role,
            teamId: invitation.teamId,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(memberEntity.id, existingMember.id));
      }
    } else {
      // Create new membership
      await db.insert(memberEntity).values({
        id: createId(),
        organizationId: invitation.organizationId,
        userId,
        teamId: invitation.teamId,
        role: invitation.role,
        status: "active",
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

    return true;
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(id: string, organizationId: string) {
    // Check if invitation exists and belongs to the organization
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
   * Resend invitation
   */
  async resendInvitation(id: string, organizationId: string) {
    // Check if invitation exists and belongs to the organization
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

    // Update invitation expiry
    const [updatedInvitation] = await db
      .update(invitationEntity)
      .set({
        expiresAt: addDays(new Date(), 7), // 7 days
        updatedAt: new Date(),
      })
      .where(eq(invitationEntity.id, id))
      .returning();

    // Resend invitation email
    try {
      // Generate invitation URL
      const inviteUrl = `${SERVER_CONFIG.FRONTEND_URL}/invitation/accept?token=${invitation.token}`;

      await emailService.sendOrganizationInvitationEmail(
        invitation.email,
        invitation.organization.name,
        invitation.inviter?.name || "A team member",
        invitation.token,
        invitation.role
      );
    } catch (error) {
      console.error("Error resending invitation email:", error);
      // Continue even if email fails
    }

    return updatedInvitation;
  }

  /**
   * Get organization invitations
   */
  async getOrganizationInvitations(organizationId: string) {
    return db.query.invitationEntity.findMany({
      where: eq(invitationEntity.organizationId, organizationId),
      with: {
        inviter: true,
      },
    });
  }

  /**
   * Update member
   */
  async updateMember(
    id: string,
    data: {
      role?: string;
      status?: string;
      teamId?: string | null;
    }
  ) {
    // Check if member exists
    const member = await db.query.memberEntity.findFirst({
      where: eq(memberEntity.id, id),
      with: {
        organization: true,
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    // Check if setting teamId to a valid team
    if (data.teamId) {
      const team = await db.query.teamEntity.findFirst({
        where: and(
          eq(teamEntity.id, data.teamId),
          eq(teamEntity.organizationId, member.organizationId)
        ),
      });

      if (!team) {
        throw new NotFoundError("Team not found in this organization");
      }
    }

    // Update member
    const [updatedMember] = await db
      .update(memberEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.id, id))
      .returning();

    return updatedMember;
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(userId: string, organizationId: string) {
    // Check if user is a member of the organization
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    if (!member) {
      throw new NotFoundError("User is not a member of this organization");
    }

    // Cannot remove the owner
    const organization = await this.getOrganizationById(organizationId);
    if (organization.agentOwnerId === userId) {
      throw new ValidationError("Cannot remove the organization owner");
    }

    // Delete member
    await db.delete(memberEntity).where(eq(memberEntity.id, member.id));

    return true;
  }

  /**
   * Transfer organization ownership
   */
  async transferOwnership(
    organizationId: string,
    newOwnerId: string,
    currentOwnerId: string
  ) {
    // Check if organization exists
    const organization = await this.getOrganizationById(organizationId);

    // Check if current user is the owner
    if (organization.agentOwnerId !== currentOwnerId) {
      throw new AuthorizationError(
        "Only the organization owner can transfer ownership"
      );
    }

    // Check if new owner is a member of the organization
    const newOwnerMember = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, newOwnerId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    if (!newOwnerMember) {
      throw new NotFoundError("New owner is not a member of this organization");
    }

    // Update organization owner
    await db
      .update(organizationEntity)
      .set({
        agentOwnerId: newOwnerId,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, organizationId));

    // Update member roles
    // New owner gets 'owner' role
    await db
      .update(memberEntity)
      .set({
        role: "owner",
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.id, newOwnerMember.id));

    // Previous owner gets 'admin' role
    const previousOwnerMember = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, currentOwnerId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    if (previousOwnerMember) {
      await db
        .update(memberEntity)
        .set({
          role: "admin",
          updatedAt: new Date(),
        })
        .where(eq(memberEntity.id, previousOwnerMember.id));
    }

    return true;
  }

  /**
   * Create team
   */
  async createTeam(data: {
    name: string;
    organizationId: string;
    description?: string;
  }) {
    // Check if organization exists
    await this.getOrganizationById(data.organizationId);

    // Create team
    const [team] = await db
      .insert(teamEntity)
      .values({
        id: createId(),
        name: data.name,
        organizationId: data.organizationId,
        description: data.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return team;
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: string) {
    const team = await db.query.teamEntity.findFirst({
      where: eq(teamEntity.id, id),
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    return team;
  }

  /**
   * Update team
   */
  async updateTeam(
    id: string,
    data: {
      name?: string;
      description?: string;
    }
  ) {
    // Check if team exists
    await this.getTeamById(id);

    // Update team
    const [team] = await db
      .update(teamEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teamEntity.id, id))
      .returning();

    return team;
  }

  /**
   * Delete team
   */
  async deleteTeam(id: string) {
    // Check if team exists
    await this.getTeamById(id);

    // Update members to remove team association
    await db
      .update(memberEntity)
      .set({
        teamId: null,
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.teamId, id));

    // Delete team
    await db.delete(teamEntity).where(eq(teamEntity.id, id));

    return true;
  }

  /**
   * Get organization teams
   */
  async getOrganizationTeams(organizationId: string) {
    return db.query.teamEntity.findMany({
      where: eq(teamEntity.organizationId, organizationId),
    });
  }

  /**
   * Add user to team
   */
  async addUserToTeam(teamId: string, userId: string, organizationId: string) {
    // Check if team exists and belongs to the organization
    const team = await db.query.teamEntity.findFirst({
      where: and(
        eq(teamEntity.id, teamId),
        eq(teamEntity.organizationId, organizationId)
      ),
    });

    if (!team) {
      throw new NotFoundError("Team not found in this organization");
    }

    // Check if user is a member of the organization
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    if (!member) {
      throw new NotFoundError("User is not a member of this organization");
    }

    // Update member's team
    await db
      .update(memberEntity)
      .set({
        teamId,
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.id, member.id));

    return true;
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(teamId: string, userId: string) {
    // Check if user is in the team
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.teamId, teamId)
      ),
    });

    if (!member) {
      throw new NotFoundError("User is not a member of this team");
    }

    // Update member to remove team association
    await db
      .update(memberEntity)
      .set({
        teamId: null,
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.id, member.id));

    return true;
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string) {
    return db.query.memberEntity.findMany({
      where: eq(memberEntity.teamId, teamId),
      with: {
        user: true,
      },
    });
  }

  /**
   * Generate a URL friendly slug from a name
   */
  private generateSlug(name: string): string {
    // Convert to lowercase, replace spaces with dashes, remove special chars
    let slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Add random suffix for uniqueness
    const randomSuffix = Math.floor(Math.random() * 10000).toString();
    slug = `${slug}-${randomSuffix}`;

    return slug;
  }
}

export const organizationService = new OrganizationService();
