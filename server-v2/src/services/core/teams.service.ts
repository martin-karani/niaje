// src/services/features/teams.service.ts
import { db } from "@/db";
import { member, properties, team } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export class TeamsService {
  /**
   * Get teams by organization
   */
  async getTeamsByOrganization(organizationId: string) {
    return db.query.team.findMany({
      where: eq(team.organizationId, organizationId),
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
  async getTeamById(id: string) {
    return db.query.team.findFirst({
      where: eq(team.id, id),
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
   * Create a new team
   */
  async createTeam(data: {
    name: string;
    organizationId: string;
    description?: string;
    memberIds?: string[];
  }) {
    // Create the team
    const result = await db
      .insert(team)
      .values({
        name: data.name,
        organizationId: data.organizationId,
        description: data.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const teamId = result[0].id;

    // Add members if provided
    if (data.memberIds && data.memberIds.length > 0) {
      // Update existing members to add team
      await db
        .update(member)
        .set({
          teamId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(member.organizationId, data.organizationId),
            inArray(member.userId, data.memberIds)
          )
        );
    }

    return result[0];
  }

  /**
   * Update a team
   */
  async updateTeam(
    id: string,
    data: Partial<{
      name: string;
      description: string;
    }>
  ) {
    const result = await db
      .update(team)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(team.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a team
   */
  async deleteTeam(id: string) {
    // First, remove team assignment from members
    await db
      .update(member)
      .set({
        teamId: null,
        updatedAt: new Date(),
      })
      .where(eq(member.teamId, id));

    // Remove team assignment from properties
    // Find properties with this team in metadata
    const propertiesWithTeam = await db.query.properties.findMany({
      where: eq(properties.metadata.teamId, id), // Assuming metadata has teamId field
    });

    // Update each property to remove team assignment
    for (const property of propertiesWithTeam) {
      const metadata = property.metadata || {};
      delete metadata.teamId;

      await db
        .update(properties)
        .set({
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, property.id));
    }

    // Delete the team
    await db.delete(team).where(eq(team.id, id));

    return true;
  }

  /**
   * Add member to team
   */
  async addMemberToTeam(teamId: string, userId: string) {
    const teamData = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      columns: {
        organizationId: true,
      },
    });

    if (!teamData) {
      throw new Error("Team not found");
    }

    const result = await db
      .update(member)
      .set({
        teamId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(member.organizationId, teamData.organizationId),
          eq(member.userId, userId)
        )
      )
      .returning();

    return result[0];
  }

  /**
   * Remove member from team
   */
  async removeMemberFromTeam(teamId: string, userId: string) {
    await db
      .update(member)
      .set({
        teamId: null,
        updatedAt: new Date(),
      })
      .where(and(eq(member.teamId, teamId), eq(member.userId, userId)));

    return true;
  }

  /**
   * Assign properties to team
   */
  async assignPropertiesToTeam(data: {
    teamId: string;
    propertyIds: string[];
    organizationId: string;
  }) {
    // Check if team exists
    const teamExists = await db.query.team.findFirst({
      where: and(
        eq(team.id, data.teamId),
        eq(team.organizationId, data.organizationId)
      ),
    });

    if (!teamExists) {
      throw new Error("Team not found or not in this organization");
    }

    // Update properties to assign to team
    for (const propertyId of data.propertyIds) {
      const property = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, propertyId),
          eq(properties.organizationId, data.organizationId)
        ),
      });

      if (property) {
        // Update metadata with team assignment
        const metadata = property.metadata || {};
        metadata.teamId = data.teamId;

        await db
          .update(properties)
          .set({
            metadata,
            updatedAt: new Date(),
          })
          .where(eq(properties.id, propertyId));
      }
    }

    return true;
  }

  /**
   * Get properties assigned to a team
   */
  async getTeamProperties(teamId: string) {
    // Find all properties with this team in metadata
    return db.query.properties.findMany({
      where: eq(properties.metadata.teamId, teamId),
    });
  }
}

export const teamsService = new TeamsService();
