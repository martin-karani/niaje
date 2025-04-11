import { leasesRouter } from "@/leases/trpc";
import { maintenanceRouter } from "@/maintenance/trpc";
import { permissionsRouter } from "@/permissions/trpc";
import { propertiesRouter } from "@/properties/trpc";
import { tenantsRouter } from "@/tenants/trpc";
import { usersRouter } from "@/users/trpc";
import { t } from "./init";

/**
 * Create the main application router
 */
export const appRouter = t.router({
  properties: propertiesRouter,
  users: usersRouter,
  tenants: tenantsRouter,
  leases: leasesRouter,
  maintenance: maintenanceRouter,
  permissions: permissionsRouter,
});

export type AppRouter = typeof appRouter;
