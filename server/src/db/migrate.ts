import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";
import dotenv from "dotenv";

dotenv.config();

const runMigrations = async () => {
  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigrations();
