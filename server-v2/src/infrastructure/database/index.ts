import * as billingEntities from "@domains/billing/entities";
import * as leaseEntities from "@domains/leases/entities";
import * as maintenanceEntities from "@domains/maintenance/entities";
import * as organizationEntities from "@domains/organizations/entities";
import * as propertyEntities from "@domains/properties/entities";
import * as tenantEntities from "@domains/tenants/entities";
import * as userEntities from "@domains/users/entities";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(-1);
});

const schema = {
  ...propertyEntities,
  ...tenantEntities,
  ...leaseEntities,
  ...userEntities,
  ...organizationEntities,
  ...billingEntities,
  ...maintenanceEntities,
};

// Create drizzle instance
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV !== "production",
});
