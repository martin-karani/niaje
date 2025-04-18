import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { ValidationError } from "@/shared/errors/validation.error";
import { communicationsService } from "../services/communications.service";

/**
 * Check permissions for communication operations
 */
function checkCommunicationsPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string; userId: string } {
  const { user, organization } = context;

  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  if (!organization) {
    throw new AuthorizationError("No active organization selected");
  }

  // For now, all authenticated users with an organization can view communications
  if (permission === "manage") {
    // Only admins, agent owners, and staff can manage communications
    const canManage = ["admin", "agent_owner", "agent_staff"].includes(
      user.role
    );
    if (!canManage) {
      throw new AuthorizationError(
        "You don't have permission to manage communications"
      );
    }
  }

  return { organizationId: organization.id, userId: user.id };
}

export const communicationsResolvers = {
  Query: {
    /**
     * Get all communications for the organization
     */
    communications: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkCommunicationsPermissions(context);
      // This would require implementing a method to get all communications
      // TODO: Implement getOrganizationCommunications in your service
      throw new Error("Not implemented yet");
    },

    /**
     * Get communications for a specific user
     */
    userCommunications: async (
      _: any,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkCommunicationsPermissions(context);

      // Ensure user is asking for their own communications unless they're an admin
      if (
        userId !== context.user?.id &&
        !["admin", "agent_owner"].includes(context.user?.role || "")
      ) {
        throw new AuthorizationError(
          "You can only view your own communications"
        );
      }

      return communicationsService.getUserCommunications(userId);
    },

    /**
     * Get communications for a specific tenant
     */
    tenantCommunications: async (
      _: any,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkCommunicationsPermissions(context);

      // TODO: Verify tenant belongs to the organization
      // This would require a tenantService.getTenantById method

      return communicationsService.getTenantCommunications(tenantId);
    },

    /**
     * Get unread communications for the current user
     */
    unreadCommunications: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId, userId } =
        checkCommunicationsPermissions(context);

      // This would require implementing a method to get unread communications
      // TODO: Implement getUnreadCommunications in your service
      throw new Error("Not implemented yet");
    },
  },

  Mutation: {
    /**
     * Create a new communication
     */
    createCommunication: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      const { organizationId, userId } = checkCommunicationsPermissions(
        context,
        "manage"
      );

      if (!data.recipientUserId && !data.recipientTenantId) {
        throw new ValidationError("A recipient is required");
      }

      return communicationsService.createCommunication({
        ...data,
        organizationId,
        senderUserId: userId,
      });
    },

    /**
     * Mark a communication as read
     */
    markCommunicationAsRead: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { userId } = checkCommunicationsPermissions(context);

      // TODO: Verify the communication belongs to the user before marking as read
      // This would require getting the communication first

      return communicationsService.markAsRead(id);
    },

    /**
     * Delete a communication
     */
    deleteCommunication: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkCommunicationsPermissions(
        context,
        "manage"
      );

      // TODO: Implement deleteCommunication in your service
      // This would require a method to delete a communication
      throw new Error("Not implemented yet");
    },
  },

  // Field resolvers for related data
  Communication: {
    sender: async (communication: any, _: any, context: GraphQLContext) => {
      if (!communication.senderUserId) return null;

      // Import dynamically to avoid circular dependencies
      const { usersService } = await import(
        "@/domains/users/services/users.service"
      );
      return usersService.getUserById(communication.senderUserId);
    },

    recipientUser: async (
      communication: any,
      _: any,
      context: GraphQLContext
    ) => {
      if (!communication.recipientUserId) return null;

      // Import dynamically to avoid circular dependencies
      const { usersService } = await import(
        "@/domains/users/services/users.service"
      );
      return usersService.getUserById(communication.recipientUserId);
    },

    recipientTenant: async (
      communication: any,
      _: any,
      context: GraphQLContext
    ) => {
      if (!communication.recipientTenantId) return null;

      // Import dynamically to avoid circular dependencies
      const { tenantsService } = await import(
        "@/domains/tenants/services/tenants.service"
      );
      return tenantsService.getTenantById(communication.recipientTenantId);
    },

    property: async (communication: any, _: any, context: GraphQLContext) => {
      if (!communication.relatedPropertyId) return null;

      // Import dynamically to avoid circular dependencies
      const { propertiesService } = await import(
        "@/domains/properties/services/properties.service"
      );
      return propertiesService.getPropertyById(communication.relatedPropertyId);
    },

    lease: async (communication: any, _: any, context: GraphQLContext) => {
      if (!communication.relatedLeaseId) return null;

      // Import dynamically to avoid circular dependencies
      const { leasesService } = await import(
        "@/domains/leases/services/leases.service"
      );
      return leasesService.getLeaseById(communication.relatedLeaseId);
    },

    maintenanceRequest: async (
      communication: any,
      _: any,
      context: GraphQLContext
    ) => {
      if (!communication.relatedMaintenanceId) return null;

      // Import dynamically to avoid circular dependencies
      const { maintenanceService } = await import(
        "@/domains/maintenance/services/maintenance.service"
      );
      return maintenanceService.getMaintenanceRequestById(
        communication.relatedMaintenanceId
      );
    },
  },
};
