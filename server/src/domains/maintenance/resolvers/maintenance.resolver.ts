// src/domains/maintenance/resolvers/maintenance.resolver.ts

import { checkMaintenancePermissions } from "@/infrastructure/auth/utils/permission-utils";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import {
  AssignMaintenanceRequestDto,
  CreateMaintenanceRequestDto,
  MaintenanceRequestIdDto,
  UpdateMaintenanceRequestDto,
} from "../dto/maintenance.dto";
import { MaintenanceRequest } from "../entities/maintenance-request.entity";
import { maintenanceService } from "../services/maintenance.service";

export const maintenanceResolvers = {
  Query: {
    maintenanceRequests: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "view"
      );
      return maintenanceService.getMaintenanceRequestsByOrganization(
        organizationId
      );
    },

    maintenanceRequest: async (
      _: any,
      { id }: MaintenanceRequestIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "view"
      );

      // Service will verify organization ID matches
      return maintenanceService.getMaintenanceRequestById(id, organizationId);
    },

    maintenanceRequestsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "view"
      );

      // Service will verify property belongs to organization
      return maintenanceService.getMaintenanceRequestsByProperty(
        propertyId,
        organizationId
      );
    },

    maintenanceRequestsByUnit: async (
      _: any,
      { unitId }: { unitId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "view"
      );

      // Service will verify unit belongs to organization
      return maintenanceService.getMaintenanceRequestsByUnit(
        unitId,
        organizationId
      );
    },

    maintenanceRequestsByAssignee: async (
      _: any,
      { assigneeId }: { assigneeId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "view"
      );

      // Service will filter by organization ID
      return maintenanceService.getMaintenanceRequestsByAssignee(
        assigneeId,
        organizationId
      );
    },
  },

  Mutation: {
    createMaintenanceRequest: async (
      _: any,
      { data }: { data: CreateMaintenanceRequestDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "manage"
      );

      // Ensure data includes organizationId
      return maintenanceService.createMaintenanceRequest({
        ...data,
        organizationId,
      });
    },

    updateMaintenanceRequest: async (
      _: any,
      { data }: { data: UpdateMaintenanceRequestDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "manage"
      );

      // Service will verify request belongs to organization
      return maintenanceService.updateMaintenanceRequest(
        data.id,
        organizationId,
        data
      );
    },

    assignMaintenanceRequest: async (
      _: any,
      { data }: { data: AssignMaintenanceRequestDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "manage"
      );

      // Service will verify request belongs to organization
      return maintenanceService.assignMaintenanceRequest(
        data.id,
        organizationId,
        data.assigneeId
      );
    },

    deleteMaintenanceRequest: async (
      _: any,
      { id }: MaintenanceRequestIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkMaintenancePermissions(
        context,
        "manage"
      );

      // Service will verify request belongs to organization
      await maintenanceService.deleteMaintenanceRequest(id, organizationId);
      return true;
    },
  },

  // Field resolvers for related data
  MaintenanceRequest: {
    property: async (
      request: MaintenanceRequest,
      _: any,
      context: GraphQLContext
    ) => {
      if (request.property) return request.property;
      return maintenanceService.getPropertyForRequest(request.propertyId);
    },

    unit: async (
      request: MaintenanceRequest,
      _: any,
      context: GraphQLContext
    ) => {
      if (!request.unitId) return null;
      if (request.unit) return request.unit;
      return maintenanceService.getUnitForRequest(request.unitId);
    },

    reporter: async (
      request: MaintenanceRequest,
      _: any,
      context: GraphQLContext
    ) => {
      if (!request.reportedBy) return null;
      if (request.reporter) return request.reporter;
      return maintenanceService.getUserById(request.reportedBy);
    },

    assignee: async (
      request: MaintenanceRequest,
      _: any,
      context: GraphQLContext
    ) => {
      if (!request.assignedTo) return null;
      if (request.assignee) return request.assignee;
      return maintenanceService.getUserById(request.assignedTo);
    },
  },
};
