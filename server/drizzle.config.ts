import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema/**/*.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://propertyapp:propertypassword@localhost:5432/propertymanagement",
  },
  verbose: true,
  strict: true,
  dialect: "postgresql",
});
