import {
  memberEntity,
  teamEntity,
  teamPropertyEntity,
  type Member,
  type Team,
} from "@/domains/organizations/entities";
import { propertyEntity } from "@/domains/properties/entities";
import { db } from "@/infrastructure/database";
import { NotFoundError, ValidationError } from "@/shared/errors";
import { and, eq, inArray } from "drizzle-orm";
import { organizationService } from "./organization.service";

export class TeamService {
  /**
   * Create a new team
   */
  async createTeam(data: {
    name: string;
    organizationId: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<Team> {
    // Check if organization exists
    await organizationService.getOrganizationById(data.organizationId);

    // Create team
    const [team] = await db
      .insert(teamEntity)
      .values({
        name: data.name,
        organizationId: data.organizationId,
        description: data.description || null,
        metadata: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

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
      metadata?: Record<string, any>;
    }
  ): Promise<Team> {
    // Check if team exists
    const team = await this.getTeamById(id);

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

    // Delete the team (related entities should cascade delete)
    await db.delete(teamEntity).where(eq(teamEntity.id, id));
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: string): Promise<Team> {
    const team = await db.query.teamEntity.findFirst({
      where: eq(teamEntity.id, id),
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    return team;
  }

  /**
   * Get teams by organization
   */
  async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    return db.query.teamEntity.findMany({
      where: eq(teamEntity.organizationId, organizationId),
      orderBy: (teams, { asc }) => [asc(teams.name)],
    });
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<Member[]> {
    const members = await db.query.memberEntity.findMany({
      where: eq(memberEntity.teamId, teamId),
      with: {
        user: true,
      },
      orderBy: (members, { asc }) => [asc(members.createdAt)],
    });

    return members;
  }

  /**
   * Add user to team
   */
  async addUserToTeam(
    teamId: string,
    userId: string,
    organizationId: string
  ): Promise<Member> {
    // Check if team exists and belongs to organization
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
      throw new ValidationError("User is not a member of this organization");
    }

    // Update member with team assignment
    const [updatedMember] = await db
      .update(memberEntity)
      .set({
        teamId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(memberEntity.userId, userId),
          eq(memberEntity.organizationId, organizationId)
        )
      )
      .returning();

    return updatedMember;
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(teamId: string, userId: string): Promise<Member> {
    // Check if user is in the team
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.teamId, teamId)
      ),
    });

    if (!member) {
      throw new NotFoundError("User is not in this team");
    }

    // Update member to remove team assignment
    const [updatedMember] = await db
      .update(memberEntity)
      .set({
        teamId: null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(memberEntity.userId, userId), eq(memberEntity.teamId, teamId))
      )
      .returning();

    return updatedMember;
  }

  /**
   * Assign properties to team
   */
  async assignPropertiesToTeam(data: {
    teamId: string;
    propertyIds: string[];
    organizationId: string;
  }): Promise<void> {
    // Check if team exists and belongs to organization
    const team = await db.query.teamEntity.findFirst({
      where: and(
        eq(teamEntity.id, data.teamId),
        eq(teamEntity.organizationId, data.organizationId)
      ),
    });

    if (!team) {
      throw new NotFoundError("Team not found in this organization");
    }

    // Check if properties exist and belong to the organization
    // Get all properties that exist in the organization
    const properties = await db.query.propertyEntity.findMany({
      where: and(
        inArray(propertyEntity.id, data.propertyIds),
        eq(propertyEntity.organizationId, data.organizationId)
      ),
    });

    if (properties.length !== data.propertyIds.length) {
      throw new ValidationError(
        "Some properties were not found in this organization"
      );
    }

    // Remove any existing team-property relationships for this team
    await db
      .delete(teamPropertyEntity)
      .where(eq(teamPropertyEntity.teamId, data.teamId));

    // Create new team-property relationships
    for (const propertyId of data.propertyIds) {
      await db.insert(teamPropertyEntity).values({
        teamId: data.teamId,
        propertyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Check if property is assigned to team
   */
  async isPropertyInTeam(teamId: string, propertyId: string): Promise<boolean> {
    const teamProperty = await db.query.teamPropertyEntity.findFirst({
      where: and(
        eq(teamPropertyEntity.teamId, teamId),
        eq(teamPropertyEntity.propertyId, propertyId)
      ),
    });

    return !!teamProperty;
  }

  /**
   * Get team's properties
   */
  async getTeamProperties(teamId: string): Promise<any[]> {
    const teamProperties = await db.query.teamPropertyEntity.findMany({
      where: eq(teamPropertyEntity.teamId, teamId),
      with: {
        property: true,
      },
    });

    return teamProperties.map((tp) => tp.property);
  }

  /**
   * Get team property IDs
   */
  async getTeamPropertyIds(teamId: string): Promise<string[]> {
    const teamProperties = await db.query.teamPropertyEntity.findMany({
      where: eq(teamPropertyEntity.teamId, teamId),
    });

    return teamProperties.map((tp) => tp.propertyId);
  }

  /**
   * Get teams that have access to a property
   */
  async getPropertyTeams(
    propertyId: string,
    organizationId: string
  ): Promise<Team[]> {
    const teamProperties = await db.query.teamPropertyEntity.findMany({
      where: eq(teamPropertyEntity.propertyId, propertyId),
      with: {
        team: {
          where: eq(teamEntity.organizationId, organizationId),
        },
      },
    });

    return teamProperties.map((tp) => tp.team).filter(Boolean) as Team[];
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string, organizationId: string): Promise<Team[]> {
    const member = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.userId, userId),
        eq(memberEntity.organizationId, organizationId),
        eq(memberEntity.teamId, null).not()
      ),
    });

    if (!member || !member.teamId) {
      return [];
    }

    const team = await this.getTeamById(member.teamId);
    return [team];
  }
}

export const teamService = new TeamService();
