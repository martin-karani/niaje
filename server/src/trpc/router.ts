import { leasesRouter } from "@/leases/trpc";
import { activitiesRouter, maintenanceRouter } from "@/maintenance/trpc";
import { notificationsRouter } from "@/notifications/trpc";
import { paymentsRouter } from "@/payments/trpc";
import { permissionsRouter } from "@/permissions/trpc";
import { propertiesRouter } from "@/properties/trpc";
import { tenantsRouter } from "@/tenants/trpc";
import { unitsRouter } from "@/units/trpc";
import { usersRouter } from "@/users/trpc";
import { router } from "./core";

/**
 * Create the main application router
 */
export const appRouter = router({
  properties: propertiesRouter,
  users: usersRouter,
  tenants: tenantsRouter,
  units: unitsRouter,
  payments: paymentsRouter,
  notifications: notificationsRouter,
  leases: leasesRouter,
  maintenance: maintenanceRouter,
  permissions: permissionsRouter,
  activities: activitiesRouter,
});

export type AppRouter = typeof appRouter;
