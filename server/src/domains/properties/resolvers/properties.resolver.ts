// src/domains/properties/resolvers/properties.resolver.ts

import { teamsService } from "@/domains/organizations/services";
import {
  checkPermissions,
  checkPropertyPermission,
} from "@/infrastructure/auth/utils/permission-utils";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { SubscriptionLimitError } from "@/shared/errors/subscription-limit.error";
import { propertiesService } from "../services/properties.service";

export const propertiesResolvers = {
  Query: {
    /**
     * Get all properties accessible to the current user
     */
    properties: async (_: any, __: any, context: GraphQLContext) => {
      // Check if user has permission to view properties
      const { organizationId } = await checkPermissions(
        context,
        "viewProperties",
        "property",
        "view"
      );

      // For users in teams, only return properties assigned to their team
      if (
        context.team &&
        context.user.role !== "admin" &&
        context.user.role !== "agent_owner"
      ) {
        // Get properties assigned to this team
        return teamsService.getTeamProperties(context.team.id);
      }

      // Otherwise return all properties in the organization
      return propertiesService.getPropertiesByOrganization(organizationId);
    },

    /**
     * Get a specific property by ID
     */
    property: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      // Check if user has permission to view this specific property
      await checkPropertyPermission(context, id, "view");

      return propertiesService.getPropertyById(id);
    },

    /**
     * Get properties owned by a specific user
     */
    propertiesByOwner: async (
      _: any,
      { ownerId }: { ownerId: string },
      context: GraphQLContext
    ) => {
      // Check if user has permission to view properties
      await checkPermissions(context, "viewProperties", "property", "view");

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

    /**
     * Get units for a specific property
     */
    units: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      // Check if user has permission to view this property
      await checkPropertyPermission(context, propertyId, "view");

      return propertiesService.getUnitsByProperty(propertyId);
    },

    /**
     * Get a specific unit by ID
     */
    unit: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      // Need to get the unit first to determine its property for permission check
      const unit = await propertiesService.getUnitById(id);

      // Then check permission for the property this unit belongs to
      await checkPropertyPermission(context, unit.propertyId, "view");

      return unit;
    },
  },

  Mutation: {
    /**
     * Create a new property
     */
    createProperty: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      // Check if user has permission to manage properties
      const { organizationId } = await checkPermissions(
        context,
        "manageProperties",
        "property",
        "create"
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

      // Create the property
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

    /**
     * Update an existing property
     */
    updateProperty: async (
      _: any,
      { id, data }: { id: string; data: any },
      context: GraphQLContext
    ) => {
      // Check if user has permission to manage this specific property
      await checkPropertyPermission(context, id, "manage");

      return propertiesService.updateProperty(id, data);
    },

    /**
     * Delete a property
     */
    deleteProperty: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      // Check if user has permission to delete this specific property
      await checkPropertyPermission(context, id, "delete");

      await propertiesService.deleteProperty(id);
      return true;
    },

    /**
     * Create a new unit in a property
     */
    createUnit: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      // Check if user has permission to manage the property this unit belongs to
      await checkPropertyPermission(context, data.propertyId, "manage");

      return propertiesService.createUnit(data);
    },

    /**
     * Update an existing unit
     */
    updateUnit: async (
      _: any,
      { id, data }: { id: string; data: any },
      context: GraphQLContext
    ) => {
      // Get the unit to find its property
      const unit = await propertiesService.getUnitById(id);

      // Check if user has permission to manage the property this unit belongs to
      await checkPropertyPermission(context, unit.propertyId, "manage");

      return propertiesService.updateUnit(id, data);
    },

    /**
     * Delete a unit
     */
    deleteUnit: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      // Get the unit to find its property
      const unit = await propertiesService.getUnitById(id);

      // Check if user has permission to delete within this property
      await checkPropertyPermission(context, unit.propertyId, "delete");

      await propertiesService.deleteUnit(id);
      return true;
    },

    /**
     * Assign a caretaker to a property
     */
    assignCaretaker: async (
      _: any,
      { propertyId, caretakerId }: { propertyId: string; caretakerId: string },
      context: GraphQLContext
    ) => {
      // Check if user has permission to manage this property
      await checkPermissions(context, "manageProperties", "property", "manage");
      await checkPropertyPermission(context, propertyId, "manage");

      return propertiesService.updateProperty(propertyId, { caretakerId });
    },

    /**
     * Change the owner of a property
     */
    changePropertyOwner: async (
      _: any,
      { propertyId, newOwnerId }: { propertyId: string; newOwnerId: string },
      context: GraphQLContext
    ) => {
      // Must be admin or agent owner to change property ownership
      if (
        context.user.role !== "admin" &&
        context.user.role !== "agent_owner"
      ) {
        throw new Error(
          "Only admins and property management owners can change property ownership"
        );
      }

      await checkPropertyPermission(context, propertyId, "manage");

      return propertiesService.updateProperty(propertyId, {
        ownerId: newOwnerId,
      });
    },

    /**
     * Assign a property to a team
     */
    assignPropertyToTeam: async (
      _: any,
      { propertyId, teamId }: { propertyId: string; teamId: string },
      context: GraphQLContext
    ) => {
      // Check if user has permission to manage teams
      await checkPermissions(context, "manageTeams", "team", "manage");

      // Check if user has permission to manage this property
      await checkPropertyPermission(context, propertyId, "manage");

      await teamsService.assignPropertiesToTeam({
        teamId,
        propertyIds: [propertyId],
        organizationId: context.organization.id,
      });

      return propertiesService.getPropertyById(propertyId);
    },
  },

  // Computed fields for Property type
  Property: {
    units: async (property: any) => {
      return propertiesService.getUnitsByProperty(property.id);
    },

    occupancyRate: async (property: any) => {
      const units = await propertiesService.getUnitsByProperty(property.id);

      if (units.length === 0) return 0;

      const occupiedUnits = units.filter(
        (unit) => unit.status === "occupied"
      ).length;

      return (occupiedUnits / units.length) * 100;
    },

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
