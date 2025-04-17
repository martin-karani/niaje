import { checkPermissions } from "@infrastructure/auth/permissions"; // Placeholder permission check
import { GraphQLContext } from "@infrastructure/graphql/context/types"; // Adjusted path
import {
  CompleteInspectionDto,
  CreateInspectionDto,
  InspectionIdDto,
  UpdateInspectionDto,
} from "../dto/inspection.dto";
import { Inspection } from "../entities/inspection.entity";
import { inspectionsService } from "../services/inspections.service";

export const inspectionsResolvers = {
  Query: {
    inspections: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewInspections");
      return inspectionsService.getInspectionsByOrganization(organizationId);
    },

    inspection: async (
      _: any,
      { id }: InspectionIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewInspections");
      return inspectionsService.getInspectionById(id, organizationId);
    },

    inspectionsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewInspections");
      return inspectionsService.getInspectionsByProperty(
        propertyId,
        organizationId
      );
    },

    inspectionsByUnit: async (
      _: any,
      { unitId }: { unitId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewInspections");
      return inspectionsService.getInspectionsByUnit(unitId, organizationId);
    },

    inspectionsByLease: async (
      _: any,
      { leaseId }: { leaseId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewInspections");
      return inspectionsService.getInspectionsByLease(leaseId, organizationId);
    },

    upcomingInspections: async (
      _: any,
      { limit }: { limit?: number },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewInspections");
      return inspectionsService.getUpcomingInspections(organizationId, limit);
    },
  },

  Mutation: {
    createInspection: async (
      _: any,
      { data }: { data: CreateInspectionDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageInspections");
      return inspectionsService.createInspection({
        ...data,
        organizationId,
      });
    },

    updateInspection: async (
      _: any,
      { data }: { data: UpdateInspectionDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageInspections");
      return inspectionsService.updateInspection(data.id, organizationId, data);
    },

    completeInspection: async (
      _: any,
      { data }: { data: CompleteInspectionDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageInspections");
      return inspectionsService.completeInspection(
        data.id,
        organizationId,
        data
      );
    },

    cancelInspection: async (
      _: any,
      { id, reason }: { id: string; reason: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageInspections");
      return inspectionsService.cancelInspection(id, organizationId, reason);
    },

    deleteInspection: async (
      _: any,
      { id }: InspectionIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageInspections");
      await inspectionsService.deleteInspection(id, organizationId);
      return true;
    },

    createMoveInInspection: async (
      _: any,
      {
        leaseId,
        scheduledDate,
        inspectorId,
      }: { leaseId: string; scheduledDate: string; inspectorId?: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageInspections");
      return inspectionsService.createMoveInInspection(
        leaseId,
        organizationId,
        new Date(scheduledDate),
        inspectorId
      );
    },

    createMoveOutInspection: async (
      _: any,
      {
        leaseId,
        scheduledDate,
        inspectorId,
      }: { leaseId: string; scheduledDate: string; inspectorId?: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageInspections");
      return inspectionsService.createMoveOutInspection(
        leaseId,
        organizationId,
        new Date(scheduledDate),
        inspectorId
      );
    },
  },

  // Field resolvers for related data
  Inspection: {
    property: async (
      inspection: Inspection,
      _: any,
      context: GraphQLContext
    ) => {
      if (inspection.property) return inspection.property;

      // Import dynamically to avoid circular dependencies
      const { propertiesService } = await import(
        "@domains/properties/services/properties.service"
      );
      return propertiesService.getPropertyById(inspection.propertyId);
    },

    unit: async (inspection: Inspection, _: any, context: GraphQLContext) => {
      if (!inspection.unitId) return null;
      if (inspection.unit) return inspection.unit;

      // Import dynamically to avoid circular dependencies
      const { propertiesService } = await import(
        "@domains/properties/services/properties.service"
      );
      return propertiesService.getUnitById(inspection.unitId);
    },

    lease: async (inspection: Inspection, _: any, context: GraphQLContext) => {
      if (!inspection.leaseId) return null;
      if (inspection.lease) return inspection.lease;

      // Import dynamically to avoid circular dependencies
      const { leasesService } = await import(
        "@domains/leases/services/leases.service"
      );
      return leasesService.getLeaseById(inspection.leaseId);
    },

    inspector: async (
      inspection: Inspection,
      _: any,
      context: GraphQLContext
    ) => {
      if (!inspection.inspectorId) return null;
      if (inspection.inspector) return inspection.inspector;

      // Import dynamically to avoid circular dependencies
      const { usersService } = await import(
        "@domains/users/services/users.service"
      );
      return usersService.getUserById(inspection.inspectorId);
    },

    documents: async (
      inspection: Inspection,
      _: any,
      context: GraphQLContext
    ) => {
      if (inspection.documents) return inspection.documents;

      // Import dynamically to avoid circular dependencies
      const { documentsService } = await import(
        "@domains/documents/services/documents.service"
      );
      return documentsService.getDocumentsByEntity(
        "inspection",
        inspection.id,
        inspection.organizationId
      );
    },
  },
};

// Placeholder permission check function
// Replace with your actual permission logic
function checkPermissions(
  context: GraphQLContext,
  permission: string
): { organizationId: string } {
  const { organization, user } = context;

  if (!user) {
    throw new Error("Authentication required");
  }

  if (!organization) {
    throw new Error("No active organization selected");
  }

  // Check appropriate permission
  if (permission === "viewInspections") {
    // All agents, caretakers, and owners can view inspections
    if (
      ![
        "admin",
        "agent_owner",
        "agent_staff",
        "caretaker",
        "property_owner",
      ].includes(user.role)
    ) {
      throw new Error("You don't have permission to view inspections");
    }
  } else if (permission === "manageInspections") {
    // Only agents and admins can manage inspections
    if (!["admin", "agent_owner", "agent_staff"].includes(user.role)) {
      throw new Error("You don't have permission to manage inspections");
    }
  }

  return { organizationId: organization.id };
}
