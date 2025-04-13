import { leasesRouter } from "@/leases/trpc";
import { maintenanceRouter } from "@/maintenance/trpc";
import { permissionsRouter } from "@/permissions/trpc";
import { propertiesRouter } from "@/properties/trpc";
import { tenantsRouter } from "@/tenants/trpc";
import { usersRouter } from "@/users/trpc";
import { router } from "./core";

/**
 * Create the main application router
 */
export const appRouter = router({
  properties: propertiesRouter,
  users: usersRouter,
  tenants: tenantsRouter,
  leases: leasesRouter,
  maintenance: maintenanceRouter,
  permissions: permissionsRouter,
});

export type AppRouter = typeof appRouter;
