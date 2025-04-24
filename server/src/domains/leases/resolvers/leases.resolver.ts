import { tenantsService } from "@/domains/tenants/services/tenants.service";
import { checkPermissions } from "@/infrastructure/auth/utils/permission-utils";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { CreateLeaseDto, LeaseIdDto, UpdateLeaseDto } from "../dto/lease.dto";
import { Lease } from "../entities/lease.entity";
import { leasesService } from "../services/leases.service";

export const leasesResolvers = {
  Query: {
    leases: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = await checkPermissions(
        context,
        "viewLeases",
        "lease",
        "view"
      );
      return leasesService.getLeasesByOrganization(organizationId);
    },

    lease: async (_: any, { id }: LeaseIdDto, context: GraphQLContext) => {
      const { organizationId } = await checkPermissions(
        context,
        "viewLeases",
        "lease",
        "view"
      );
      // Service method checkLeaseOrg ensures it belongs to the org
      return leasesService.getLeaseById(id);
    },

    leasesByProperty: async (
      _: any,
      { propertyId }: { propertyId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPermissions(
        context,
        "viewLeases",
        "lease",
        "view"
      );
      return leasesService.getLeasesByProperty(propertyId, organizationId);
    },

    leasesByUnit: async (
      _: any,
      { unitId }: { unitId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPermissions(
        context,
        "viewLeases",
        "lease",
        "view"
      );
      return leasesService.getLeasesByUnit(unitId, organizationId);
    },

    leasesByTenant: async (
      _: any,
      { tenantId }: { tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPermissions(
        context,
        "viewLeases",
        "lease",
        "view"
      );
      return leasesService.getLeasesByTenant(tenantId, organizationId);
    },
  },

  Mutation: {
    createLease: async (
      _: any,
      { data }: { data: CreateLeaseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPermissions(
        context,
        "manageLeases",
        "lease",
        "create"
      );
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
      const { organizationId } = await checkPermissions(
        context,
        "manageLeases",
        "lease",
        "update"
      );
      // Service method checkLeaseOrg ensures it belongs to the org before update
      return leasesService.updateLease(data.id, organizationId, data);
    },

    deleteLease: async (
      _: any,
      { id }: LeaseIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPermissions(
        context,
        "manageLeases",
        "lease",
        "delete"
      );
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
      const { propertiesService } = await import(
        "@/domains/properties/services/properties.service"
      );
      return propertiesService.getUnitById(lease.unitId);
    },
    // Example: Fetch the property associated with the lease
    property: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires PropertiesService or use pre-fetched data
      if (lease.property) return lease.property;
      if (lease.unit?.property) return lease.unit.property;
      // Fallback fetch
      const { propertiesService } = await import(
        "@/domains/properties/services/properties.service"
      );
      return propertiesService.getPropertyById(lease.propertyId);
    },
    creator: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires UsersService or use pre-fetched data
      if (lease.creator) return lease.creator;
      if (!lease.createdBy) return null;
      // Fallback fetch
      const { usersService } = await import(
        "@/domains/users/services/users.service"
      );
      return usersService.getUserById(lease.createdBy);
    },
    payments: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires BillingService or use pre-fetched data
      if (lease.payments) return lease.payments;
      // Fallback fetch
      const { paymentsService } = await import(
        "@/domains/billing/services/payments.service"
      );
      return paymentsService.getPaymentsByLease(lease.id, lease.organizationId);
    },
    utilityBills: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires BillingService or use pre-fetched data
      if (lease.utilityBills) return lease.utilityBills;
      // Fallback fetch
      const { utilityBillsService } = await import(
        "@/domains/billing/services/utility-bill.service"
      );
      return utilityBillsService.getUtilityBillsByLease(
        lease.id,
        lease.organizationId
      );
    },
    documents: async (lease: Lease, _: any, context: GraphQLContext) => {
      // Requires DocumentsService or use pre-fetched data
      if (lease.documents) return lease.documents;
      // Fallback fetch
      const { documentsService } = await import(
        "@/domains/documents/services/documents.services"
      );
      return documentsService.getDocumentsByLease(
        lease.id,
        lease.organizationId
      );
    },
  },
};
