import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { DB_CONFIG } from "./src/shared/constants/enviroment";
dotenv.config();

export default defineConfig({
  schema: [
    "./src/domains/**/entities/**/*.ts",
    "./src/domains/**/entities/*.ts",
  ],
  out: "./src/infrastructure/database/migrations",
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
