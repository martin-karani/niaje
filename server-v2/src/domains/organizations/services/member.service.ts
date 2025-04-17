import { db } from "@infrastructure/database";
import { createId } from "@infrastructure/database/utils/id-generator";
import { NotFoundError } from "@shared/errors/not-found.error";
import { ValidationError } from "@shared/errors/validation.error";
import { and, eq } from "drizzle-orm";
import {
  Member,
  NewMember,
  invitationEntity,
  memberEntity,
  organizationEntity,
  teamEntity,
} from "../entities/organization.entity";

export class MembersService {
  /**
   * Get all members for an organization
   */
  async getOrganizationMembers(organizationId: string): Promise<Member[]> {
    return db.query.memberEntity.findMany({
      where: eq(memberEntity.organizationId, organizationId),
      with: {
        user: true,
        team: true,
      },
    });
  }

  /**
   * Get member by ID
   */
  async getMemberById(id: string): Promise<Member> {
    const member = await db.query.memberEntity.findFirst({
      where: eq(memberEntity.id, id),
      with: {
        user: true,
        team: true,
        organization: true,
      },
    });

    if (!member) {
      throw new NotFoundError(`Member with ID ${id} not found`);
    }

    return member;
  }

  /**
   * Get organization membership for a user
   */
  async getUserOrganizationMembership(
    userId: string,
    organizationId: string
  ): Promise<Member | null> {
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
      with: {
        user: true,
        team: true,
        organization: true,
      },
    });

    return member;
  }

  /**
   * Add a user to an organization
   */
  async addUserToOrganization(data: {
    userId: string;
    organizationId: string;
    role: string;
    teamId?: string;
  }): Promise<Member> {
    // Check if organization exists
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, data.organizationId),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    // Check if user is already a member
    const existingMember = await this.getUserOrganizationMembership(
      data.userId,
      data.organizationId
    );

    if (existingMember) {
      throw new ValidationError(
        "User is already a member of this organization"
      );
    }

    // Check team belongs to organization if provided
    if (data.teamId) {
      const team = await db.query.teamEntity.findFirst({
        where: and(
          eq(teamEntity.id, data.teamId),
          eq(teamEntity.organizationId, data.organizationId)
        ),
      });

      if (!team) {
        throw new ValidationError("Team not found or not in this organization");
      }
    }

    // Create membership
    const membershipData: NewMember = {
      id: createId(),
      organizationId: data.organizationId,
      userId: data.userId,
      teamId: data.teamId || null,
      role: data.role,
      status: "active",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newMember] = await db
      .insert(memberEntity)
      .values(membershipData)
      .returning();

    return newMember;
  }

  /**
   * Update organization member
   */
  async updateMember(
    id: string,
    data: {
      role?: string;
      status?: string;
      teamId?: string | null;
    }
  ): Promise<Member> {
    // Check if member exists
    const member = await this.getMemberById(id);

    // If changing team, check if team belongs to organization
    if (data.teamId !== undefined) {
      if (data.teamId) {
        const team = await db.query.teamEntity.findFirst({
          where: and(
            eq(teamEntity.id, data.teamId),
            eq(teamEntity.organizationId, member.organizationId)
          ),
        });

        if (!team) {
          throw new ValidationError(
            "Team not found or not in this organization"
          );
        }
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
   * Remove a user from an organization
   */
  async removeUserFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    // Check if user is a member
    const member = await this.getUserOrganizationMembership(
      userId,
      organizationId
    );

    if (!member) {
      throw new NotFoundError("User is not a member of this organization");
    }

    // Cannot remove organization owner
    if (member.role === "owner") {
      throw new ValidationError("Cannot remove organization owner");
    }

    // Remove membership
    await db.delete(memberEntity).where(eq(memberEntity.id, member.id));

    // Cancel any pending invitations for this user's email
    const invitations = await db.query.invitationEntity.findMany({
      where: and(
        eq(invitationEntity.organizationId, organizationId),
        eq(invitationEntity.email, member.user.email),
        eq(invitationEntity.status, "pending")
      ),
    });

    if (invitations.length > 0) {
      await db
        .update(invitationEntity)
        .set({
          status: "canceled",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invitationEntity.organizationId, organizationId),
            eq(invitationEntity.email, member.user.email),
            eq(invitationEntity.status, "pending")
          )
        );
    }
  }

  /**
   * Change member's role
   */
  async changeMemberRole(
    id: string,
    newRole: string,
    currentUserId: string
  ): Promise<Member> {
    // Check if member exists
    const member = await this.getMemberById(id);

    // Get current user's membership
    const currentUserMember = await this.getUserOrganizationMembership(
      currentUserId,
      member.organizationId
    );

    if (!currentUserMember) {
      throw new ValidationError("You are not a member of this organization");
    }

    // Only owners can change roles
    if (currentUserMember.role !== "owner") {
      throw new ValidationError("Only organization owners can change roles");
    }

    // Cannot change own role from owner
    if (
      member.userId === currentUserId &&
      member.role === "owner" &&
      newRole !== "owner"
    ) {
      throw new ValidationError("Cannot change your own owner role");
    }

    // Update member role
    const [updatedMember] = await db
      .update(memberEntity)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.id, id))
      .returning();

    return updatedMember;
  }

  /**
   * Transfer organization ownership
   */
  async transferOwnership(
    organizationId: string,
    newOwnerId: string,
    currentOwnerId: string
  ): Promise<void> {
    // Check if organization exists
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    // Get current owner membership
    const currentOwnerMember = await this.getUserOrganizationMembership(
      currentOwnerId,
      organizationId
    );

    if (!currentOwnerMember || currentOwnerMember.role !== "owner") {
      throw new ValidationError(
        "Only the current owner can transfer ownership"
      );
    }

    // Get new owner membership
    const newOwnerMember = await this.getUserOrganizationMembership(
      newOwnerId,
      organizationId
    );

    if (!newOwnerMember) {
      throw new ValidationError(
        "New owner must be a member of the organization"
      );
    }

    // Start transaction to update both members and organization
    await db.transaction(async (tx) => {
      // Change current owner's role to admin
      await tx
        .update(memberEntity)
        .set({
          role: "admin",
          updatedAt: new Date(),
        })
        .where(eq(memberEntity.id, currentOwnerMember.id));

      // Change new owner's role to owner
      await tx
        .update(memberEntity)
        .set({
          role: "owner",
          updatedAt: new Date(),
        })
        .where(eq(memberEntity.id, newOwnerMember.id));

      // Update organization's agent owner
      await tx
        .update(organizationEntity)
        .set({
          agentOwnerId: newOwnerId,
          updatedAt: new Date(),
        })
        .where(eq(organizationEntity.id, organizationId));
    });
  }
}

// Export singleton instance
export const membersService = new MembersService();
