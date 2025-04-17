import { teamsService } from "@/domains/organizations/services";
import { db } from "@/infrastructure/database";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { SubscriptionLimitError } from "@/shared/errors/subscription-limit.error";
import { eq } from "drizzle-orm";
import { unitEntity, type Unit } from "../entities/unit.entity";
import { propertiesService } from "../services/properties.service";

/**
 * Helper function to check property permissions
 */
async function checkPropertyPermissions(
  context: GraphQLContext,
  action: "view" | "manage" | "delete",
  propertyId?: string
): Promise<{ organizationId: string }> {
  const { user, organization, team, permissions } = context;

  if (!organization) {
    throw new Error("No active organization selected");
  }

  const { id: organizationId } = organization;

  // Check appropriate permission
  let hasPermission = false;

  switch (action) {
    case "view":
      hasPermission = permissions.canViewProperties;
      break;
    case "manage":
      hasPermission = permissions.canManageProperties;
      break;
    case "delete":
      hasPermission = permissions.canDeleteProperties;
      break;
  }

  if (!hasPermission) {
    throw new AuthorizationError(
      `You don't have permission to ${action} properties`
    );
  }

  // If checking a specific property and user is in a team, verify access
  if (
    propertyId &&
    team &&
    user.role !== "admin" &&
    user.role !== "agent_owner"
  ) {
    const hasAccess = await teamsService.isPropertyInTeam(team.id, propertyId);
    if (!hasAccess) {
      throw new AuthorizationError("You don't have access to this property");
    }
  }

  return { organizationId };
}

export const propertiesResolvers = {
  Query: {
    properties: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = await checkPropertyPermissions(
        context,
        "view"
      );

      // For users in teams, only return properties assigned to their team
      if (
        context.team &&
        context.user.role !== "admin" &&
        context.user.role !== "agent_owner"
      ) {
        const teamProperties = await teamsService.getTeamProperties(
          context.team.id
        );
        return teamProperties;
      }

      return propertiesService.getPropertiesByOrganization(organizationId);
    },

    property: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "view", id);
      return propertiesService.getPropertyById(id);
    },

    propertiesByOwner: async (
      _: any,
      { ownerId }: { ownerId: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "view");

      const properties = await propertiesService.getPropertiesByOwner(ownerId);

      // Filter by team if required
      if (
        context.team &&
        context.user.role !== "admin" &&
        context.user.role !== "agent_owner"
      ) {
        const teamPropertyIds = await teamsService.getTeamPropertyIds(
          context.team.id
        );
        return properties.filter((p) => teamPropertyIds.includes(p.id));
      }

      return properties;
    },

    propertiesByCaretaker: async (
      _: any,
      { caretakerId }: { caretakerId: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "view");

      const properties =
        await propertiesService.getPropertiesByCaretaker(caretakerId);

      // Filter by team if required
      if (
        context.team &&
        context.user.role !== "admin" &&
        context.user.role !== "agent_owner"
      ) {
        const teamPropertyIds = await teamsService.getTeamPropertyIds(
          context.team.id
        );
        return properties.filter((p) => teamPropertyIds.includes(p.id));
      }

      return properties;
    },

    propertiesByTeam: async (
      _: any,
      { teamId }: { teamId: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "view");
      return teamsService.getTeamProperties(teamId);
    },

    units: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "view", propertyId);
      return propertiesService.getUnitsByProperty(propertyId);
    },

    unit: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const unit = await propertiesService.getUnitById(id);
      await checkPropertyPermissions(context, "view", unit.propertyId);
      return unit;
    },
  },

  Mutation: {
    createProperty: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPropertyPermissions(
        context,
        "manage"
      );

      // Check subscription limits
      const { maxProperties } = context.features;
      const hasReachedLimit = await propertiesService.hasReachedPropertyLimit(
        organizationId,
        maxProperties
      );

      if (hasReachedLimit) {
        throw new SubscriptionLimitError(
          `You have reached the maximum number of properties (${maxProperties}) allowed for your subscription plan`
        );
      }

      const property = await propertiesService.createProperty({
        ...data,
        organizationId,
      });

      // If user is in a team, automatically assign property to that team
      if (context.team && context.user.role !== "agent_owner") {
        await teamsService.assignPropertiesToTeam({
          teamId: context.team.id,
          propertyIds: [property.id],
          organizationId,
        });
      }

      return property;
    },

    updateProperty: async (
      _: any,
      { id, data }: { id: string; data: any },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "manage", id);
      return propertiesService.updateProperty(id, data);
    },

    deleteProperty: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "delete", id);
      await propertiesService.deleteProperty(id);
      return true;
    },

    createUnit: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "manage", data.propertyId);
      return propertiesService.createUnit(data);
    },

    updateUnit: async (
      _: any,
      { id, data }: { id: string; data: any },
      context: GraphQLContext
    ) => {
      const unit = await propertiesService.getUnitById(id);
      await checkPropertyPermissions(context, "manage", unit.propertyId);
      return propertiesService.updateUnit(id, data);
    },

    deleteUnit: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const unit = await propertiesService.getUnitById(id);
      await checkPropertyPermissions(context, "delete", unit.propertyId);
      await propertiesService.deleteUnit(id);
      return true;
    },

    assignCaretaker: async (
      _: any,
      { propertyId, caretakerId }: { propertyId: string; caretakerId: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "manage", propertyId);
      return propertiesService.updateProperty(propertyId, { caretakerId });
    },

    changePropertyOwner: async (
      _: any,
      { propertyId, newOwnerId }: { propertyId: string; newOwnerId: string },
      context: GraphQLContext
    ) => {
      await checkPropertyPermissions(context, "manage", propertyId);
      return propertiesService.updateProperty(propertyId, {
        ownerId: newOwnerId,
      });
    },

    assignPropertyToTeam: async (
      _: any,
      { propertyId, teamId }: { propertyId: string; teamId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPropertyPermissions(
        context,
        "manage",
        propertyId
      );

      await teamsService.assignPropertiesToTeam({
        teamId,
        propertyIds: [propertyId],
        organizationId,
      });

      return propertiesService.getPropertyById(propertyId);
    },
  },

  // Computed fields
  Property: {
    units: async (property: any) => {
      return propertiesService.getUnitsByProperty(property.id);
    },

    occupancyRate: async (property: any) => {
      const units: Unit[] = await db.query.unitEntity.findMany({
        where: eq(unitEntity.propertyId, property.id),
      });

      if (units.length === 0) return 0;

      const occupiedUnits: number = units.filter(
        (unit) => unit.status === "occupied"
      ).length;

      return (occupiedUnits / units.length) * 100;
    },

    // Add a field to check if property is assigned to user's current team
    isInActiveTeam: async (property: any, _: any, context: GraphQLContext) => {
      if (!context.team) return false;

      try {
        return await teamsService.isPropertyInTeam(
          context.team.id,
          property.id
        );
      } catch (error) {
        console.error("Error checking property team assignment:", error);
        return false;
      }
    },
  },
};
