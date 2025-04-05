import { sql } from "drizzle-orm";
import { db } from "../src/db";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function addIndex() {
  console.log("Adding unique index to accounts table...");

  try {
    // Execute raw SQL to create the index
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS provider_account_idx 
      ON accounts (provider_id, account_id);
    `);

    console.log("Successfully added index to accounts table");
    process.exit(0);
  } catch (error) {
    console.error("Failed to add index:", error);
    process.exit(1);
  }
}

addIndex();
