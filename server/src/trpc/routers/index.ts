import { router } from "../index";
import { propertiesRouter } from "./properties";
import { usersRouter } from "./users";

// Create the root router by merging all sub-routers
export const appRouter = router({
  users: usersRouter,
  properties: propertiesRouter,
});

// Export type of the router
export type AppRouter = typeof appRouter;
