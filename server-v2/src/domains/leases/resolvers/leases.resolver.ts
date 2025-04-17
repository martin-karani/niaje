import { tenantsService } from "@domains/tenants/services/tenants.service"; // Needed for tenant relations
import { checkPermissions } from "@infrastructure/auth/permissions"; // Placeholder permission check
import { GraphQLContext } from "@infrastructure/graphql/context/types"; // Adjusted path
import { CreateLeaseDto, LeaseIdDto, UpdateLeaseDto } from "../dto/lease.dto";
import { Lease } from "../entities/lease.entity";
import { leasesService } from "../services/leases.service";

export const leasesResolvers = {
  Query: {
    leases: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewLeases");
      return leasesService.getLeasesByOrganization(organizationId);
    },

    lease: async (_: any, { id }: LeaseIdDto, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewLeases");
      // Service method checkLeaseOrg ensures it belongs to the org
      return leasesService.getLeaseById(id);
    },

    leasesByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewLeases");
      // Need to verify property belongs to org first
      // Add check here... (Requires PropertiesService)
      return leasesService.getLeasesByProperty(propertyId, organizationId);
    },

    leasesByUnit: async (
      _: any,
      { unitId }: { unitId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewLeases");
      // Need to verify unit belongs to org first
      // Add check here... (Requires PropertiesService)
      return leasesService.getLeasesByUnit(unitId, organizationId);
    },

    leasesByTenant: async (
      _: any,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "viewLeases");
      // Need to verify tenant belongs to org first
      // Add check here... (Requires TenantsService)
      return leasesService.getLeasesByTenant(tenantId, organizationId);
    },
  },

  Mutation: {
    createLease: async (
      _: any,
      { data }: { data: CreateLeaseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageLeases");
      const userId = context.user?.id;
      if (!userId) {
        throw new Error("User context not found for creating lease.");
      }

      const leaseData = {
        ...data,
        organizationId,
        createdBy: userId,
      };
      return leasesService.createLease(leaseData);
    },

    updateLease: async (
      _: any,
      { data }: { data: UpdateLeaseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageLeases");
      // Service method checkLeaseOrg ensures it belongs to the org before update
      return leasesService.updateLease(data.id, organizationId, data);
    },

    deleteLease: async (
      _: any,
      { id }: LeaseIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageLeases");
      // Service method checkLeaseOrg ensures it belongs to the org before delete
      await leasesService.deleteLease(id, organizationId);
      return true; // Indicate success
    },
  },

  // Field resolvers for related data
  Lease: {
    // Example: Fetch tenants assigned to this lease
    tenants: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Use tenantsService or data already fetched
      if (lease.tenantAssignments) {
        return lease.tenantAssignments
          .map((a) => a.tenant)
          .filter((t) => t != null); // Use pre-fetched data if available
      }
      // Fallback fetch if not included in initial query
      return tenantsService.getTenantsForLease(lease.id);
    },
    // Example: Fetch the unit associated with the lease
    unit: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires PropertiesService or use pre-fetched data
      if (lease.unit) return lease.unit;
      // Fallback fetch
      // return propertiesService.getUnitById(lease.unitId); // Assuming PropertiesService exists
      return null; // Placeholder
    },
    // Example: Fetch the property associated with the lease
    property: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires PropertiesService or use pre-fetched data
      if (lease.property) return lease.property;
      if (lease.unit?.property) return lease.unit.property;
      // Fallback fetch
      // return propertiesService.getPropertyById(lease.propertyId); // Assuming PropertiesService exists
      return null; // Placeholder
    },
    creator: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires UsersService or use pre-fetched data
      if (lease.creator) return lease.creator;
      if (!lease.createdBy) return null;
      // Fallback fetch
      // return usersService.getUserById(lease.createdBy); // Assuming UsersService exists
      return null; // Placeholder
    },
    payments: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires BillingService or use pre-fetched data
      if (lease.payments) return lease.payments;
      // Fallback fetch
      // return billingService.getPaymentsByLease(lease.id); // Assuming BillingService exists
      return []; // Placeholder
    },
    utilityBills: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires BillingService or use pre-fetched data
      if (lease.utilityBills) return lease.utilityBills;
      // Fallback fetch
      // return billingService.getUtilityBillsByLease(lease.id); // Assuming BillingService exists
      return []; // Placeholder
    },
    documents: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires DocumentsService or use pre-fetched data
      if (lease.documents) return lease.documents;
      // Fallback fetch
      // return documentsService.getDocumentsByLease(lease.id); // Assuming DocumentsService exists
      return []; // Placeholder
    },
  },
};

// Placeholder permission check function
// Replace with your actual permission logic
function checkPermissions(
  context: GraphQLContext,
  permission: string
): { organizationId: string } {
  const { organization } = context;
  if (!organization) {
    throw new Error("No active organization selected");
  }
  // TODO: Implement actual permission check logic based on user roles/permissions
  console.log(`Checking permission: ${permission} for org: ${organization.id}`);
  if (!context.permissions || !context.permissions[permission]) {
    // throw new AuthorizationError(`Missing permission: ${permission}`);
  }
  return { organizationId: organization.id };
}
