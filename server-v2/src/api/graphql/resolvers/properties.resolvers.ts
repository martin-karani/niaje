// src/api/graphql/resolvers/properties.resolvers.ts
import { propertiesService } from "@/services/core/properties.service";
import { teamsService } from "@/services/features/teams.service";

export const propertiesResolvers = {
  Query: {
    properties: async (_, __, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.getPropertiesByOrganization(
        activeOrganization.id
      );
    },

    property: async (_, { id }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.getPropertyById(id);
    },

    propertiesByOwner: async (_, { ownerId }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.getPropertiesByOwner(ownerId);
    },

    propertiesByCaretaker: async (
      _,
      { caretakerId },
      { user, activeOrganization }
    ) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.getPropertiesByCaretaker(caretakerId);
    },

    propertiesByTeam: async (_, { teamId }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return teamsService.getTeamProperties(teamId);
    },

    units: async (_, { propertyId }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      // Assuming units are fetched through property relation or directly
      return propertiesService.getUnitsByProperty(propertyId);
    },

    unit: async (_, { id }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.getUnitById(id);
    },
  },

  Mutation: {
    createProperty: async (_, { data }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.createProperty({
        ...data,
        organizationId: activeOrganization.id,
      });
    },

    updateProperty: async (_, { id, data }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.updateProperty(id, data);
    },

    deleteProperty: async (_, { id }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      await propertiesService.deleteProperty(id);
      return true;
    },

    createUnit: async (_, { data }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.createUnit(data);
    },

    updateUnit: async (_, { id, data }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.updateUnit(id, data);
    },

    deleteUnit: async (_, { id }, { user, activeOrganization }) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      await propertiesService.deleteUnit(id);
      return true;
    },

    assignCaretaker: async (
      _,
      { propertyId, caretakerId },
      { user, activeOrganization }
    ) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.updateProperty(propertyId, { caretakerId });
    },

    changePropertyOwner: async (
      _,
      { propertyId, newOwnerId },
      { user, activeOrganization }
    ) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      return propertiesService.updateProperty(propertyId, {
        ownerId: newOwnerId,
      });
    },

    assignPropertyToTeam: async (
      _,
      { propertyId, teamId },
      { user, activeOrganization }
    ) => {
      if (!activeOrganization) {
        throw new Error("No active organization selected");
      }

      await teamsService.assignPropertiesToTeam({
        teamId,
        propertyIds: [propertyId],
        organizationId: activeOrganization.id,
      });

      return propertiesService.getPropertyById(propertyId);
    },
  },

  // Computed fields
  Property: {
    occupancyRate: async (property) => {
      const units = await propertiesService.getUnitsByProperty(property.id);
      if (units.length === 0) return 0;

      const occupiedUnits = units.filter(
        (unit) => unit.status === "occupied"
      ).length;
      return (occupiedUnits / units.length) * 100;
    },

    monthlyIncome: async (property) => {
      const units = await propertiesService.getUnitsByProperty(property.id);
      return units.reduce((total, unit) => total + (unit.currentRent || 0), 0);
    },
  },
};
