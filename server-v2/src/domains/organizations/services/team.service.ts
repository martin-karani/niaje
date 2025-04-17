import { propertyEntity } from "@/domains/properties/entities/property.entity";
import { db } from "@/infrastructure/database";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { ValidationError } from "@/shared/errors/validation.error";
import { and, eq, inArray } from "drizzle-orm";
import {
  Member,
  NewTeam,
  Team,
  memberEntity,
  organizationEntity,
  teamEntity,
} from "../entities/organization.entity";
import { teamPropertyEntity } from "../entities/team-property.entity";

export class TeamsService {
  /**
   * Get teams for an organization
   */
  async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    return db.query.teamEntity.findMany({
      where: eq(teamEntity.organizationId, organizationId),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: string): Promise<Team> {
    const team = await db.query.teamEntity.findFirst({
      where: eq(teamEntity.id, id),
      with: {
        members: {
          with: {
            user: true,
          },
        },
        organization: true,
      },
    });

    if (!team) {
      throw new NotFoundError(`Team with ID ${id} not found`);
    }

    return team;
  }

  /**
   * Create a new team
   */
  async createTeam(data: {
    name: string;
    organizationId: string;
    description?: string;
    metadata?: any;
  }): Promise<Team> {
    // Check if organization exists
    const organization = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, data.organizationId),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    // Create team
    const teamData: NewTeam = {
      name: data.name,
      organizationId: data.organizationId,
      description: data.description,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [team] = await db.insert(teamEntity).values(teamData).returning();
    return team;
  }

  /**
   * Update a team
   */
  async updateTeam(
    id: string,
    data: {
      name?: string;
      description?: string;
      metadata?: any;
    }
  ): Promise<Team> {
    // Check if team exists
    await this.getTeamById(id);

    // Update team
    const [updatedTeam] = await db
      .update(teamEntity)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teamEntity.id, id))
      .returning();

    return updatedTeam;
  }

  /**
   * Delete a team
   */
  async deleteTeam(id: string): Promise<void> {
    // Check if team exists
    await this.getTeamById(id);

    // Delete team (cascade will delete team memberships and property assignments)
    await db.delete(teamEntity).where(eq(teamEntity.id, id));
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<Member[]> {
    const team = await this.getTeamById(teamId);

    return db.query.memberEntity.findMany({
      where: eq(memberEntity.teamId, teamId),
      with: {
        user: true,
      },
    });
  }

  /**
   * Add a user to a team
   */
  async addUserToTeam(
    teamId: string,
    userId: string,
    organizationId: string
  ): Promise<Member> {
    // Check if team exists and belongs to organization
    const team = await this.getTeamById(teamId);
    if (team.organizationId !== organizationId) {
      throw new ValidationError("Team does not belong to the organization");
    }

    // Check if user is a member of the organization
    const orgMembership = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId)
      ),
    });

    if (!orgMembership) {
      throw new ValidationError("User is not a member of the organization");
    }

    // Check if user is already in the team
    const existingMembership = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.teamId, teamId)
      ),
    });

    if (existingMembership) {
      // User is already in the team, return existing membership
      return existingMembership;
    }

    // Update user's organization membership to include the team
    const [updatedMembership] = await db
      .update(memberEntity)
      .set({
        teamId,
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.id, orgMembership.id))
      .returning();

    return updatedMembership;
  }

  /**
   * Remove a user from a team
   */
  async removeUserFromTeam(teamId: string, userId: string): Promise<void> {
    // Check if user is in the team
    const membership = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.teamId, teamId)
      ),
    });

    if (!membership) {
      throw new NotFoundError("User is not a member of the team");
    }

    // Remove team assignment (don't delete the org membership)
    await db
      .update(memberEntity)
      .set({
        teamId: null,
        updatedAt: new Date(),
      })
      .where(eq(memberEntity.id, membership.id));
  }

  /**
   * Assign properties to a team
   */
  async assignPropertiesToTeam(data: {
    teamId: string;
    propertyIds: string[];
    organizationId: string;
  }): Promise<number> {
    // Check if team exists and belongs to organization
    const team = await this.getTeamById(data.teamId);
    if (team.organizationId !== data.organizationId) {
      throw new ValidationError("Team does not belong to the organization");
    }

    // Verify all properties belong to the organization
    const properties = await db.query.propertyEntity.findMany({
      where: and(
        eq(propertyEntity.organizationId, data.organizationId),
        inArray(propertyEntity.id, data.propertyIds)
      ),
    });

    if (properties.length !== data.propertyIds.length) {
      throw new ValidationError(
        "One or more properties not found or not in this organization"
      );
    }

    // Get existing assignments
    const existingAssignments = await db.query.teamPropertyEntity.findMany({
      where: eq(teamPropertyEntity.teamId, data.teamId),
    });

    const existingPropertyIds = existingAssignments.map((a) => a.propertyId);

    // Properties to add (not already assigned)
    const propertiesToAdd = data.propertyIds.filter(
      (id) => !existingPropertyIds.includes(id)
    );

    // Properties to remove (no longer in the list)
    const propertiesToRemove = existingPropertyIds.filter(
      (id) => !data.propertyIds.includes(id)
    );

    // Start a transaction
    await db.transaction(async (tx) => {
      // Add new assignments
      if (propertiesToAdd.length > 0) {
        await tx.insert(teamPropertyEntity).values(
          propertiesToAdd.map((propertyId) => ({
            teamId: data.teamId,
            propertyId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      // Remove old assignments
      if (propertiesToRemove.length > 0) {
        for (const propertyId of propertiesToRemove) {
          await tx
            .delete(teamPropertyEntity)
            .where(
              and(
                eq(teamPropertyEntity.teamId, data.teamId),
                eq(teamPropertyEntity.propertyId, propertyId)
              )
            );
        }
      }
    });

    return data.propertyIds.length;
  }

  /**
   * Get properties assigned to a team
   */
  async getTeamProperties(teamId: string): Promise<any[]> {
    const assignments = await db.query.teamPropertyEntity.findMany({
      where: eq(teamPropertyEntity.teamId, teamId),
      with: {
        property: true,
      },
    });

    return assignments.map((a) => a.property);
  }

  /**
   * Get property IDs assigned to a team
   */
  async getTeamPropertyIds(teamId: string): Promise<string[]> {
    const assignments = await db.query.teamPropertyEntity.findMany({
      where: eq(teamPropertyEntity.teamId, teamId),
    });

    return assignments.map((a) => a.propertyId);
  }

  /**
   * Check if property is assigned to team
   */
  async isPropertyInTeam(teamId: string, propertyId: string): Promise<boolean> {
    const assignment = await db.query.teamPropertyEntity.findFirst({
      where: and(
        eq(teamPropertyEntity.teamId, teamId),
        eq(teamPropertyEntity.propertyId, propertyId)
      ),
    });

    return !!assignment;
  }
}

// Export singleton instance
export const teamsService = new TeamsService();
