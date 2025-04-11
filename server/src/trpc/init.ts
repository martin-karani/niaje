import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { Context } from "./context";

/**
 * Initialize tRPC with context type and error formatting
 */
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
