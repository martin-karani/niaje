import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { Context } from "./context";

// Initialize tRPC
export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

// Create protected procedures - no imports from middleware.ts here
export const protectedProcedureBase = publicProcedure.use(
  async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  }
);

// Role-based procedures
export const adminProcedureBase = protectedProcedureBase.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new Error("Not authorized");
    }
    return next();
  }
);

export const landlordProcedureBase = protectedProcedureBase.use(
  async ({ ctx, next }) => {
    if (!["LANDLORD", "ADMIN"].includes(ctx.user.role)) {
      throw new Error("Not authorized");
    }
    return next();
  }
);

export const caretakerProcedureBase = protectedProcedureBase.use(
  async ({ ctx, next }) => {
    if (!["CARETAKER", "LANDLORD", "ADMIN"].includes(ctx.user.role)) {
      throw new Error("Not authorized");
    }
    return next();
  }
);

export const agentProcedureBase = protectedProcedureBase.use(
  async ({ ctx, next }) => {
    if (!["AGENT", "LANDLORD", "ADMIN"].includes(ctx.user.role)) {
      throw new Error("Not authorized");
    }
    return next();
  }
);
