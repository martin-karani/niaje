// src/trpc/middleware.ts
import { Permission } from "@/permissions/models";
import { TRPCError } from "@trpc/server";
import { t } from "./init";

/**
 * Middleware that requires authentication
 */
export const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

/**
 * Middleware that checks if user has required role
 */
export const hasRole = (allowedRoles: string[]) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }

    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });

/**
 * Middleware that requires a specific permission
 */
export const requirePermission = (permission: Permission) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const hasPermission = await ctx.permissions.hasPermission(permission);
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You don't have the required permission: ${permission}`,
      });
    }

    return next();
  });
};

/**
 * Middleware that requires property-specific permission
 */
export const requirePropertyPermission = (permission: Permission) => {
  return t.middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Get property ID from input
    if (
      !input ||
      typeof input !== "object" ||
      !("propertyId" in input || "id" in input)
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Property ID is required",
      });
    }

    const propertyId = (input as any).propertyId || (input as any).id;

    const hasPermission = await ctx.permissions.hasPropertyPermission(
      propertyId,
      permission
    );
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You don't have the required permission for this property: ${permission}`,
      });
    }

    return next();
  });
};

// Base procedure
export const protectedProcedure = t.procedure.use(isAuthenticated);

// Create descriptive procedures for common operations
export const adminProcedure = protectedProcedure.use(
  requirePermission("users:manage")
);

// Property management procedures
export const propertiesManageProcedure = protectedProcedure.use(
  requirePermission("properties:manage")
);
export const propertiesViewProcedure = protectedProcedure.use(
  requirePermission("properties:view")
);

// Tenant management procedures
export const tenantsManageProcedure = protectedProcedure.use(
  requirePermission("tenants:manage")
);
export const tenantsViewProcedure = protectedProcedure.use(
  requirePermission("tenants:view")
);

// Lease management procedures
export const leasesManageProcedure = protectedProcedure.use(
  requirePermission("leases:manage")
);
export const leasesViewProcedure = protectedProcedure.use(
  requirePermission("leases:view")
);

// Payment procedures
export const paymentsCollectProcedure = protectedProcedure.use(
  requirePermission("payments:collect")
);
export const paymentsViewProcedure = protectedProcedure.use(
  requirePermission("payments:view")
);

// Maintenance procedures
export const maintenanceManageProcedure = protectedProcedure.use(
  requirePermission("maintenance:manage")
);
export const maintenanceViewProcedure = protectedProcedure.use(
  requirePermission("maintenance:view")
);

// Reports procedure
export const reportsViewProcedure = protectedProcedure.use(
  requirePermission("reports:view")
);

// Property-specific procedures
export const propertyManageProcedure = protectedProcedure.use(
  requirePropertyPermission("properties:manage")
);
export const propertyTenantsProcedure = protectedProcedure.use(
  requirePropertyPermission("tenants:manage")
);
export const propertyLeasesProcedure = protectedProcedure.use(
  requirePropertyPermission("leases:manage")
);
export const propertyMaintenanceProcedure = protectedProcedure.use(
  requirePropertyPermission("maintenance:manage")
);
export const propertyPaymentsProcedure = protectedProcedure.use(
  requirePropertyPermission("payments:collect")
);
