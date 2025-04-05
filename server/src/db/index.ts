import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema/index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import Pool from pg package using ESM-compatible way
const { Pool } = pkg;

// Create connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://propertyapp:propertypassword@localhost:5432/propertymanagement",
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Export schema for type usage
export { schema };

// Export a function to get a new database connection
export const getDb = () => {
  return drizzle(pool, { schema });
};
