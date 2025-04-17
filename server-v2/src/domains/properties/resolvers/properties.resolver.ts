import { db } from "@/db";
import { teamsService } from "@domains/organizations/services/teams.service";
import { GraphQLContext } from "@infrastructure/graphql/context/types";
import { AuthorizationError } from "@shared/errors/authorization.error";
import { SubscriptionLimitError } from "@shared/errors/subscription-limit.error";
import { eq } from "drizzle-orm";
import { unitEntity, type Unit } from "../entities/unit.entity";
import { propertiesService } from "../services/properties.service";

/**
 * Helper function to check property permissions
 */
function checkPropertyPermissions(
  context: GraphQLContext,
  action: "view" | "manage" | "delete"
): { organizationId: string } {
  const { user, organization, permissions } = context;

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

  return { organizationId };
}

export const propertiesResolvers = {
  Query: {
    properties: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPropertyPermissions(context, "view");
      return propertiesService.getPropertiesByOrganization(organizationId);
    },

    property: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "view");
      return propertiesService.getPropertyById(id);
    },

    propertiesByOwner: async (
      _: any,
      { ownerId }: { ownerId: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "view");
      return propertiesService.getPropertiesByOwner(ownerId);
    },

    propertiesByCaretaker: async (
      _: any,
      { caretakerId }: { caretakerId: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "view");
      return propertiesService.getPropertiesByCaretaker(caretakerId);
    },

    propertiesByTeam: async (
      _: any,
      { teamId }: { teamId: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "view");
      return teamsService.getTeamProperties(teamId);
    },

    units: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "view");
      return propertiesService.getUnitsByProperty(propertyId);
    },

    unit: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      checkPropertyPermissions(context, "view");
      return propertiesService.getUnitById(id);
    },
  },

  Mutation: {
    createProperty: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPropertyPermissions(context, "manage");

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

      return propertiesService.createProperty({
        ...data,
        organizationId,
      });
    },

    updateProperty: async (
      _: any,
      { id, data }: { id: string; data: any },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "manage");
      return propertiesService.updateProperty(id, data);
    },

    deleteProperty: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "delete");
      await propertiesService.deleteProperty(id);
      return true;
    },

    createUnit: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "manage");
      return propertiesService.createUnit(data);
    },

    updateUnit: async (
      _: any,
      { id, data }: { id: string; data: any },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "manage");
      return propertiesService.updateUnit(id, data);
    },

    deleteUnit: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "delete");
      await propertiesService.deleteUnit(id);
      return true;
    },

    assignCaretaker: async (
      _: any,
      { propertyId, caretakerId }: { propertyId: string; caretakerId: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "manage");
      return propertiesService.updateProperty(propertyId, { caretakerId });
    },

    changePropertyOwner: async (
      _: any,
      { propertyId, newOwnerId }: { propertyId: string; newOwnerId: string },
      context: GraphQLContext
    ) => {
      checkPropertyPermissions(context, "manage");
      return propertiesService.updateProperty(propertyId, {
        ownerId: newOwnerId,
      });
    },

    assignPropertyToTeam: async (
      _: any,
      { propertyId, teamId }: { propertyId: string; teamId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPropertyPermissions(context, "manage");

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
  },
};
