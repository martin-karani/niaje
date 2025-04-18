import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import { documentsService } from "../services/documents.services";

/**
 * Check permissions for document operations
 */
function checkDocumentPermissions(
  context: GraphQLContext,
  permission: "view" | "manage" = "view"
): { organizationId: string; userId: string } {
  const { user, organization, features } = context;

  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  if (!organization) {
    throw new AuthorizationError("No active organization selected");
  }

  // Check subscription features
  if (!features.documentStorage) {
    throw new AuthorizationError(
      "Document storage feature is not available on your current plan"
    );
  }

  // For viewing documents, all authenticated users with an organization can view
  if (permission === "manage") {
    // Only admins, agent owners, and staff can manage documents
    const canManage = ["admin", "agent_owner", "agent_staff"].includes(
      user.role
    );
    if (!canManage) {
      throw new AuthorizationError(
        "You don't have permission to manage documents"
      );
    }
  }

  return { organizationId: organization.id, userId: user.id };
}

export const documentsResolvers = {
  Query: {
    /**
     * Get all documents for the organization
     */
    documents: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkDocumentPermissions(context);
      return documentsService.getDocumentsByOrganization(organizationId);
    },

    /**
     * Get document by ID
     */
    document: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkDocumentPermissions(context);
      return documentsService.getDocumentById(id, organizationId);
    },

    /**
     * Get documents by property
     */
    documentsByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkDocumentPermissions(context);
      return documentsService.getDocumentsByProperty(
        propertyId,
        organizationId
      );
    },

    /**
     * Get documents by lease
     */
    documentsByLease: async (
      _: any,
      { leaseId }: { leaseId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkDocumentPermissions(context);
      return documentsService.getDocumentsByLease(leaseId, organizationId);
    },

    /**
     * Get documents by tenant
     */
    documentsByTenant: async (
      _: any,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkDocumentPermissions(context);
      return documentsService.getDocumentsByTenant(tenantId, organizationId);
    },

    /**
     * Get documents by inspection
     */
    documentsByInspection: async (
      _: any,
      { inspectionId }: { inspectionId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkDocumentPermissions(context);
      return documentsService.getDocumentsByEntity(
        "inspection",
        inspectionId,
        organizationId
      );
    },
  },

  Mutation: {
    /**
     * Upload document
     * Note: This is a placeholder - actual file upload would typically be handled
     * through a REST endpoint using multipart/form-data.
     */
    uploadDocument: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      const { organizationId, userId } = checkDocumentPermissions(
        context,
        "manage"
      );

      // This is a placeholder since file uploads are typically not done via GraphQL
      // The actual implementation would use a REST endpoint with multer
      throw new Error(
        "Document uploads should be done via the /api/upload/file endpoint"
      );
    },

    /**
     * Delete document
     */
    deleteDocument: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkDocumentPermissions(context, "manage");
      return documentsService.deleteDocument(id, organizationId);
    },

    /**
     * Update document details
     */
    updateDocumentDetails: async (
      _: any,
      { id, description }: { id: string; description: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkDocumentPermissions(context, "manage");
      return documentsService.updateDocument(id, organizationId, {
        description,
      });
    },
  },

  // Field resolvers for related data
  Document: {
    organization: async (document: any, _: any, context: GraphQLContext) => {
      // Import dynamically to avoid circular dependencies
      const { organizationsService } = await import(
        "@/domains/organizations/services/organization.service"
      );
      return organizationsService.getOrganizationById(document.organizationId);
    },

    uploader: async (document: any, _: any, context: GraphQLContext) => {
      if (!document.uploadedBy) return null;

      // Import dynamically to avoid circular dependencies
      const { usersService } = await import(
        "@/domains/users/services/users.service"
      );
      return usersService.getUserById(document.uploadedBy);
    },

    property: async (document: any, _: any, context: GraphQLContext) => {
      if (!document.relatedPropertyId) return null;

      // Import dynamically to avoid circular dependencies
      const { propertiesService } = await import(
        "@/domains/properties/services/properties.service"
      );
      return propertiesService.getPropertyById(document.relatedPropertyId);
    },

    unit: async (document: any, _: any, context: GraphQLContext) => {
      if (!document.relatedUnitId) return null;

      // Import dynamically to avoid circular dependencies
      const { propertiesService } = await import(
        "@/domains/properties/services/properties.service"
      );
      return propertiesService.getUnitById(document.relatedUnitId);
    },

    lease: async (document: any, _: any, context: GraphQLContext) => {
      if (!document.relatedLeaseId) return null;

      // Import dynamically to avoid circular dependencies
      const { leasesService } = await import(
        "@/domains/leases/services/leases.service"
      );
      return leasesService.getLeaseById(document.relatedLeaseId);
    },

    tenant: async (document: any, _: any, context: GraphQLContext) => {
      if (!document.relatedTenantId) return null;

      // Import dynamically to avoid circular dependencies
      const { tenantsService } = await import(
        "@/domains/tenants/services/tenants.service"
      );
      return tenantsService.getTenantById(document.relatedTenantId);
    },

    inspection: async (document: any, _: any, context: GraphQLContext) => {
      if (!document.relatedInspectionId) return null;

      // Import dynamically to avoid circular dependencies
      const { inspectionsService } = await import(
        "@/domains/inspections/services/inspections.service"
      );
      return inspectionsService.getInspectionById(document.relatedInspectionId);
    },
  },
};
