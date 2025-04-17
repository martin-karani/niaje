import { leaseEntity } from "@/domains/leases/entities";
import { checkPermissions } from "@/infrastructure/auth/permissions";
import { db } from "@/infrastructure/database";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { eq } from "drizzle-orm";
import {
  AssignTenantToLeaseDto,
  CreateTenantDto,
  TenantIdDto,
  UpdateTenantDto,
} from "../dto/tenant.dto";
import { LeaseTenant, Tenant } from "../entities";
import { tenantsService } from "../services/tenants.service";

export const tenantsResolvers = {
  Query: {
    tenants: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "viewTenants");
      return tenantsService.getTenantsByOrganization(organizationId);
    },

    tenant: async (_: any, { id }: TenantIdDto, context: GraphQLContext) => {
      // Add permission check: ensure user can view this specific tenant
      // Might involve checking if tenant belongs to user's org
      checkPermissions(context, "viewTenants");
      // Additional check: ensure tenant 'id' belongs to context.organizationId
      const tenant = await tenantsService.getTenantById(id);
      if (tenant.organizationId !== context.organization?.id) {
        throw new Error("Tenant not found in your organization.");
      }
      return tenant;
    },

    tenantsByLease: async (
      _: any,
      { leaseId }: { leaseId: string },
      context: GraphQLContext
    ) => {
      // Add permission check: Ensure user can view this lease's tenants
      checkPermissions(context, "viewLeases"); // Or a more specific permission
      // Additional check: ensure lease 'leaseId' belongs to context.organizationId
      // ... (Requires lease service or check)
      return tenantsService.getTenantsForLease(leaseId);
    },
  },

  Mutation: {
    createTenant: async (
      _: any,
      { data }: { data: CreateTenantDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageTenants");
      // Ensure data includes organizationId or set it from context
      const tenantData = { ...data, organizationId };
      return tenantsService.createTenant(tenantData);
    },

    updateTenant: async (
      _: any,
      { data }: { data: UpdateTenantDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageTenants");
      // Add check: ensure tenant being updated belongs to the user's org
      const existingTenant = await tenantsService.getTenantById(data.id);
      if (existingTenant.organizationId !== organizationId) {
        throw new Error("Cannot update tenant from another organization.");
      }
      return tenantsService.updateTenant(data.id, data);
    },

    deleteTenant: async (
      _: any,
      { id }: TenantIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageTenants");
      // Add check: ensure tenant being deleted belongs to the user's org
      const existingTenant = await tenantsService.getTenantById(id);
      if (existingTenant.organizationId !== organizationId) {
        throw new Error("Cannot delete tenant from another organization.");
      }
      await tenantsService.deleteTenant(id);
      return true; // Indicate success
    },

    assignTenantToLease: async (
      _: any,
      { data }: { data: AssignTenantToLeaseDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageLeases"); // Or specific assignment permission
      // Add checks: ensure both lease and tenant belong to the user's org
      // ...
      return tenantsService.assignTenantToLease(data);
    },

    removeTenantFromLease: async (
      _: any,
      { leaseId, tenantId }: { leaseId: string; tenantId: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "manageLeases"); // Or specific assignment permission
      // Add checks: ensure both lease and tenant belong to the user's org
      // ...
      await tenantsService.removeTenantFromLease(leaseId, tenantId);
      return true;
    },
  },

  // Field resolvers for related data if needed
  Tenant: {
    // Example: Fetch related user account
    userAccount: async (tenant: Tenant, _: any, context: GraphQLContext) => {
      if (!tenant.userId) return null;
      // Add permission checks if necessary before fetching user details
      // Requires UsersService
      // return usersService.getUserById(tenant.userId);
      return tenant.userAccount; // Already fetched in service example
    },
    // Example: Fetch leases associated with the tenant
    leases: async (tenant: Tenant, _: any, context: GraphQLContext) => {
      // Requires LeaseService or use assignments already fetched
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
    // Field resolvers for the join table if accessed directly
    lease: async (assignment: LeaseTenant) => {
      // Fetch lease if not already included
      return (
        assignment.lease || // Assumes 'with' was used in parent query
        (await db.query.leaseEntity.findFirst({
          where: eq(leaseEntity.id, assignment.leaseId),
        }))
      );
    },
    tenant: async (assignment: LeaseTenant) => {
      // Fetch tenant if not already included
      return (
        assignment.tenant || // Assumes 'with' was used in parent query
        (await db.query.tenantEntity.findFirst({
          where: eq(tenantEntity.id, assignment.tenantId),
        }))
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
