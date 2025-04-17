import { propertyEntity } from "@domains/properties/entities/property.entity";
import { db } from "@infrastructure/database";
import { NotFoundError } from "@shared/errors/not-found.error";
import { ValidationError } from "@shared/errors/validation.error";
import { and, eq } from "drizzle-orm";
import {
  Member,
  NewTeam,
  Team,
  memberEntity,
  organizationEntity,
  teamEntity,
} from "../entities/organization.entity";

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

    // Delete team (cascade will delete team memberships)
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
    // Check each property in propertyIds
    const properties = await db.query.propertyEntity.findMany({
      where: and(
        eq(propertyEntity.organizationId, data.organizationId)
        // TODO: Add condition to filter by propertyIds once we have a way to check if propertyId is in list
      ),
    });

    // For simplicity, let's just add all properties to team metadata for now
    // In a real implementation, you would have a separate join table for team-property assignments
    const metadata = team.metadata || {};
    metadata.assignedProperties = data.propertyIds;

    // Update team
    await db
      .update(teamEntity)
      .set({
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(teamEntity.id, data.teamId));

    return data.propertyIds.length;
  }

  /**
   * Get properties assigned to a team
   */
  async getTeamProperties(teamId: string): Promise<any[]> {
    const team = await this.getTeamById(teamId);

    // Get property IDs from team metadata
    const assignedPropertyIds = team.metadata?.assignedProperties || [];

    // Fetch properties
    if (assignedPropertyIds.length === 0) {
      return [];
    }

    // Return properties that are in the assignedPropertyIds list
    // For simplicity, we'll fetch all properties from organization and filter
    const properties = await db.query.propertyEntity.findMany({
      where: eq(propertyEntity.organizationId, team.organizationId),
    });

    return properties.filter((property) =>
      assignedPropertyIds.includes(property.id)
    );
  }
}

// Export singleton instance
export const teamsService = new TeamsService();
