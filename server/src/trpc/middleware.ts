import { TRPCError } from "@trpc/server";
import { t } from "./index";

// Middleware that requires authentication
export const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      // Add user to context
      user: ctx.user,
    },
  });
});

// Middleware that checks if user has required role
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

// Export procedures with middleware applied
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = protectedProcedure.use(hasRole(["ADMIN"]));
export const landlordProcedure = protectedProcedure.use(
  hasRole(["LANDLORD", "ADMIN"])
);
export const caretakerProcedure = protectedProcedure.use(
  hasRole(["CARETAKER", "LANDLORD", "ADMIN"])
);
export const agentProcedure = protectedProcedure.use(
  hasRole(["AGENT", "LANDLORD", "ADMIN"])
);
