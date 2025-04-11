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
 * Middleware that checks property-specific permissions
 */
export const checkPropertyPermission = (permissionType?: string) => {
  return t.middleware(async ({ ctx, next, input }) => {
    // Only apply to inputs that have propertyId
    if (!input || typeof input !== "object" || !("propertyId" in input)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Property ID is required",
      });
    }

    const propertyId = (input as any).id || (input as any).propertyId;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // For admins, skip permission check
    if (ctx.user.role === "ADMIN") {
      return next();
    }

    // Check if user is the property owner
    const isOwner = await ctx.isPropertyOwner(propertyId);
    if (isOwner) {
      return next();
    }

    // For normal users, check property permission
    const hasPermission = await ctx.hasPropertyPermission(
      propertyId,
      permissionType
    );
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: permissionType
          ? `You don't have ${permissionType} permission for this property`
          : "You don't have access to this property",
      });
    }

    return next();
  });
};

/**
 * Middleware for routes that only property owners can access
 */
export const checkPropertyOwnership = t.middleware(
  async ({ ctx, next, input }) => {
    // Only apply to inputs that have propertyId
    if (
      !input ||
      typeof input !== "object" ||
      !("id" in input || "propertyId" in input)
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Property ID is required",
      });
    }

    const propertyId = (input as any).id || (input as any).propertyId;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Allow admins
    if (ctx.user.role === "ADMIN") {
      return next();
    }

    // Check if user is the property owner
    const isOwner = await ctx.isPropertyOwner(propertyId);
    if (!isOwner) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the property owner can perform this action",
      });
    }

    return next();
  }
);

// Create convenience procedures with permission checks
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = protectedProcedure.use(hasRole(["ADMIN"]));
export const landlordProcedure = protectedProcedure.use(
  hasRole(["LANDLORD", "ADMIN"])
);

// Property-specific procedures
export const propertyProcedure = protectedProcedure.use(
  checkPropertyPermission()
);
export const propertyOwnerProcedure = protectedProcedure.use(
  checkPropertyOwnership
);
export const tenantManagerProcedure = protectedProcedure.use(
  checkPropertyPermission("manageTenants")
);
export const leaseManagerProcedure = protectedProcedure.use(
  checkPropertyPermission("manageLeases")
);
export const paymentCollectorProcedure = protectedProcedure.use(
  checkPropertyPermission("collectPayments")
);
export const financialViewerProcedure = protectedProcedure.use(
  checkPropertyPermission("viewFinancials")
);
export const maintenanceManagerProcedure = protectedProcedure.use(
  checkPropertyPermission("manageMaintenance")
);
export const propertyManagerProcedure = protectedProcedure.use(
  checkPropertyPermission("manageProperties")
);
