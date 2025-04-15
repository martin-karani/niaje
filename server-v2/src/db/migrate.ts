import dotenv from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { db } from "./index";

dotenv.config();

const runMigrations = async () => {
  console.log("Running migrations...");

  try {
    const migrationsFolder = path.resolve(__dirname, "./migrations");

    await migrate(db, {
      migrationsFolder,
      migrationsTable: "drizzle_migrations",
    });

    console.log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
} else {
  module.exports = { runMigrations };
}
