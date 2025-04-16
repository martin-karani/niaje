import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { DB_CONFIG } from "./src/config/environment";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema/**/*.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: DB_CONFIG.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  dialect: "postgresql",
  migrations: {
    table: "drizzle_migrations",
    schema: "public",
  },
  tablesFilter: ["*"],
  breakpoints: true,
});
