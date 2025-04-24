// src/infrastructure/auth/services/organization.service.ts

import {
  memberEntity,
  organizationEntity,
  teamEntity,
  type Member,
  type Organization,
} from "@/domains/organizations/entities/organization.entity";
import { userEntity } from "@/domains/users/entities/user.entity";
import { db } from "@/infrastructure/database";
import emailService from "@/infrastructure/email/email.service";
import {
  AuthorizationError,
  NotFoundError,
  SubscriptionLimitError,
  ValidationError,
} from "@/shared/errors";
import { addMonths } from "date-fns";
import { and, eq } from "drizzle-orm";
import { invitationService } from "./invitation.service";

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
  }): Promise<Organization> {
    // Validate user exists
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, data.userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Generate slug if not provided
    const slug = data.slug
      ? this.normalizeSlug(data.slug)
      : this.generateSlug(data.name);

    // Check if slug is available
    const existingOrg = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
    });

    if (existingOrg) {
      throw new ValidationError("Organization identifier already taken");
    }

    // Calculate trial expiration date
    const trialExpiresAt = addMonths(new Date(), 1); // 1 month trial

    // Create organization
    const [organization] = await db
      .insert(organizationEntity)
      .values({
        name: data.name,
        slug,
        agentOwnerId: data.userId,
        trialStatus: "active",
        trialStartedAt: new Date(),
        trialExpiresAt,
        subscriptionStatus: "trialing",
        maxProperties: 5, // Trial limits
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

    // Add user as an owner member
    await db.insert(memberEntity).values({
      organizationId: organization.id,
      userId: data.userId,
      role: "owner",
      status: "active",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send welcome email
    try {
      await emailService.sendTrialWelcomeEmail(
        user.email,
        user.name || user.email,
        organization.name,
        organization.trialExpiresAt
      );
    } catch (error) {
      console.error("Error sending welcome email:", error);
      // Continue anyway - non-critical error
    }

    return organization;
  }

  /**
   * Update an organization
   */
  async updateOrganization(
    id: string,
    data: Partial<Organization>
  ): Promise<Organization> {
    // Validate organization exists
    const organization = await this.getOrganizationById(id);

    // Update organization
    const [updatedOrg] = await db
      .update(organizationEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, id))
      .returning();

    return updatedOrg;
  }

  /**
   * Delete an organization
   */
  async deleteOrganization(id: string): Promise<void> {
    // Check if organization exists
    await this.getOrganizationById(id);

    // Delete organization (all related entities should cascade delete)
    await db.delete(organizationEntity).where(eq(organizationEntity.id, id));
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
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
  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.slug, slug),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    return organization;
  }

  /**
   * Get organizations where user is a member
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const members = await db.query.memberEntity.findMany({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.status, "active")
      ),
      with: {
        organization: true,
      },
    });

    return members.map((member) => member.organization);
  }

  /**
   * Check if user is a member of organization
   */
  async isUserMemberOfOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId),
        eq(memberEntity.status, "active")
      ),
    });

    return !!member;
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string): Promise<Member[]> {
    const members = await db.query.memberEntity.findMany({
      where: eq(memberEntity.organizationId, organizationId),
      with: {
        user: true,
        team: true,
      },
      orderBy: (members, { desc }) => [desc(members.createdAt)],
    });

    return members;
  }

  /**
   * Invite user to organization
   */
  async inviteUserToOrganization(data: {
    organizationId: string;
    email: string;
    role: string;
    inviterId: string;
    teamId?: string;
  }): Promise<{ id: string; token: string }> {
    // Check if organization exists
    await this.getOrganizationById(data.organizationId);

    // Check if inviter is a member of the organization
    const isMember = await this.isUserMemberOfOrganization(
      data.inviterId,
      data.organizationId
    );

    if (!isMember) {
      throw new AuthorizationError("You are not a member of this organization");
    }

    // Check if user limit is reached
    const canInvite = await this.canInviteUsers(data.organizationId);
    if (!canInvite) {
      throw new SubscriptionLimitError(
        "You have reached the maximum number of users for your subscription plan"
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
        throw new NotFoundError("Team not found");
      }
    }

    // Check if user is already a member
    const existingUser = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, data.email.toLowerCase()),
    });

    if (existingUser) {
      const existingMember = await db.query.memberEntity.findFirst({
        where: and(
          eq(memberEntity.userId, existingUser.id),
          eq(memberEntity.organizationId, data.organizationId)
        ),
      });

      if (existingMember) {
        if (existingMember.status === "active") {
          throw new ValidationError(
            "User is already a member of this organization"
          );
        } else {
          // Update existing member to pending
          await db
            .update(memberEntity)
            .set({
              status: "pending",
              role: data.role,
              teamId: data.teamId || null,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(memberEntity.userId, existingUser.id),
                eq(memberEntity.organizationId, data.organizationId)
              )
            );
        }
      }
    }

    // Create invitation
    const invitation = await invitationService.createInvitation({
      email: data.email.toLowerCase(),
      role: data.role,
      organizationId: data.organizationId,
      inviterId: data.inviterId,
      teamId: data.teamId,
    });

    return invitation;
  }

  /**
   * Check if organization can invite more users
   */
  async canInviteUsers(organizationId: string): Promise<boolean> {
    const organization = await this.getOrganizationById(organizationId);

    // Get current user count (active + pending invitations)
    const activeMembers = await db.query.memberEntity.findMany({
      where: and(
        eq(memberEntity.organizationId, organizationId),
        eq(memberEntity.status, "active")
      ),
    });

    const pendingInvitations = await db.query.invitationEntity.findMany({
      where: and(
        eq(invitationEntity.organizationId, organizationId),
        eq(invitationEntity.status, "pending")
      ),
    });

    const totalUsers = activeMembers.length + pendingInvitations.length;

    // Check if user limit is reached
    return totalUsers < organization.maxUsers;
  }

  /**
   * Transfer organization ownership
   */
  async transferOwnership(
    organizationId: string,
    newOwnerId: string,
    currentOwnerId: string
  ): Promise<Organization> {
    // Check if organization exists
    const organization = await this.getOrganizationById(organizationId);

    // Verify current owner
    if (organization.agentOwnerId !== currentOwnerId) {
      throw new AuthorizationError(
        "Only the current owner can transfer ownership"
      );
    }

    // Check if new owner is a member
    const isMember = await this.isUserMemberOfOrganization(
      newOwnerId,
      organizationId
    );

    if (!isMember) {
      throw new ValidationError(
        "New owner must be a member of the organization"
      );
    }

    // Update organization owner
    const [updatedOrg] = await db
      .update(organizationEntity)
      .set({
        agentOwnerId: newOwnerId,
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, organizationId))
      .returning();

    // Update member roles
    await db
      .update(memberEntity)
      .set({
        role: "member",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(memberEntity.userId, currentOwnerId),
          eq(memberEntity.organizationId, organizationId)
        )
      );

    await db
      .update(memberEntity)
      .set({
        role: "owner",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(memberEntity.userId, newOwnerId),
          eq(memberEntity.organizationId, organizationId)
        )
      );

    return updatedOrg;
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Add random suffix to prevent collisions
    const randomSuffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    return `${slug}-${randomSuffix}`;
  }

  /**
   * Normalize slug
   */
  private normalizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export const organizationService = new OrganizationService();
