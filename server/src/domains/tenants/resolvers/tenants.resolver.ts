import { leaseEntity } from "@/domains/leases/entities";
import {
  checkPermissions,
  checkTenantPermissions,
} from "@/infrastructure/auth/utils/permission-utils";
import { db } from "@/infrastructure/database";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors";
import { eq } from "drizzle-orm";
import {
  AssignTenantToLeaseDto,
  CreateTenantDto,
  TenantIdDto,
  UpdateTenantDto,
} from "../dto/tenant.dto";
import { LeaseTenant, Tenant, leaseTenantsEntity } from "../entities";
import { tenantsService } from "../services/tenants.service";

export const tenantsResolvers = {
  Query: {
    tenants: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = await checkTenantPermissions(context, "view");
      return tenantsService.getTenantsByOrganization(organizationId);
    },

    tenant: async (_: any, { id }: TenantIdDto, context: GraphQLContext) => {
      // Check permission and verify tenant belongs to organization
      const { organizationId } = await checkTenantPermissions(context, "view");
      const tenant = await tenantsService.getTenantById(id);

      if (tenant.organizationId !== organizationId) {
        throw new AuthorizationError("Tenant not found in your organization");
      }

      return tenant;
    },

    tenantsByLease: async (
      _: any,
      { leaseId }: { leaseId: string },
      context: GraphQLContext
    ) => {
      // Check lease permissions and verify lease exists in organization
      await checkPermissions(context, "viewLeases", "lease", "view");

      // Additional check: ensure lease belongs to context.organizationId
      const lease = await db.query.leaseEntity.findFirst({
        where: eq(leaseEntity.id, leaseId),
      });

      if (!lease || lease.organizationId !== context.organization?.id) {
        throw new AuthorizationError("Lease not found in your organization");
      }

      return tenantsService.getTenantsForLease(leaseId);
    },
  },

  Mutation: {
    createTenant: async (
      _: any,
      { data }: { data: CreateTenantDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkTenantPermissions(
        context,
        "manage"
      );

      // Ensure data includes organizationId from context
      const tenantData = {
        ...data,
        organizationId,
      };

      return tenantsService.createTenant(tenantData);
    },

    updateTenant: async (
      _: any,
      { data }: { data: UpdateTenantDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkTenantPermissions(
        context,
        "manage"
      );

      // Verify tenant being updated belongs to organization
      const existingTenant = await tenantsService.getTenantById(data.id);
      if (existingTenant.organizationId !== organizationId) {
        throw new AuthorizationError(
          "Cannot update tenant from another organization"
        );
      }

      return tenantsService.updateTenant(data.id, data);
    },

    deleteTenant: async (
      _: any,
      { id }: TenantIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkTenantPermissions(
        context,
        "manage"
      );

      // Verify tenant being deleted belongs to organization
      const existingTenant = await tenantsService.getTenantById(id);
      if (existingTenant.organizationId !== organizationId) {
        throw new AuthorizationError(
          "Cannot delete tenant from another organization"
        );
      }

      await tenantsService.deleteTenant(id);
      return true;
    },

    assignTenantToLease: async (
      _: any,
      { data }: { data: AssignTenantToLeaseDto },
      context: GraphQLContext
    ) => {
      // Check lease permissions
      const { organizationId } = await checkPermissions(
        context,
        "manageLeases",
        "lease",
        "manage"
      );

      // Verify both lease and tenant belong to organization
      const lease = await db.query.leaseEntity.findFirst({
        where: eq(leaseEntity.id, data.leaseId),
      });

      if (!lease || lease.organizationId !== organizationId) {
        throw new AuthorizationError("Lease not found in your organization");
      }

      const tenant = await tenantsService.getTenantById(data.tenantId);
      if (tenant.organizationId !== organizationId) {
        throw new AuthorizationError("Tenant not found in your organization");
      }

      return tenantsService.assignTenantToLease(data);
    },

    removeTenantFromLease: async (
      _: any,
      { leaseId, tenantId }: { leaseId: string; tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = await checkPermissions(
        context,
        "manageLeases",
        "lease",
        "manage"
      );

      // Verify both lease and tenant belong to organization
      const lease = await db.query.leaseEntity.findFirst({
        where: eq(leaseEntity.id, leaseId),
      });

      if (!lease || lease.organizationId !== organizationId) {
        throw new AuthorizationError("Lease not found in your organization");
      }

      const tenant = await tenantsService.getTenantById(tenantId);
      if (tenant.organizationId !== organizationId) {
        throw new AuthorizationError("Tenant not found in your organization");
      }

      await tenantsService.removeTenantFromLease(leaseId, tenantId);
      return true;
    },
  },

  // Field resolvers for related data
  Tenant: {
    userAccount: async (tenant: Tenant, _: any, context: GraphQLContext) => {
      if (!tenant.userId) return null;
      return tenant.userAccount; // Already fetched in service
    },

    leases: async (tenant: Tenant, _: any, context: GraphQLContext) => {
      const assignments =
        tenant.leaseAssignments ||
        (await db.query.leaseTenantsEntity.findMany({
          where: eq(leaseTenantsEntity.tenantId, tenant.id),
          with: { lease: true },
        }));

      return assignments.map((a) => a.lease);
    },
  },

  LeaseTenant: {
    lease: async (assignment: LeaseTenant) => {
      return (
        assignment.lease ||
        (await db.query.leaseEntity.findFirst({
          where: eq(leaseEntity.id, assignment.leaseId),
        }))
      );
    },

    tenant: async (assignment: LeaseTenant) => {
      return (
        assignment.tenant ||
        (await db.query.tenantEntity.findFirst({
          where: eq(tenantEntity.id, assignment.tenantId),
        }))
      );
    },
  },
};
