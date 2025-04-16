// src/server.ts
import { validateConfig } from "@/config/environment";
import { startScheduler } from "@/cron/scheduler";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { setupApi } from "./api";
import { db } from "./db";

dotenv.config();

async function startServer() {
  try {
    // Validate required environment configuration
    validateConfig();

    // Test the database connection
    await testDatabaseConnection();

    const PORT = process.env.PORT || 3001;
    const app = await setupApi();

    // Start any background tasks (e.g. cron jobs)
    startScheduler();

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`GraphQL endpoint: http://localhost:${PORT}/api/graphql`);
      console.log(`Auth endpoint: http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Helper function to test the database connection.
async function testDatabaseConnection() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    console.log("Database connection successful");
    return result;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

// Only start the server if this file is executed directly.
if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unhandled error during server startup:", error);
    process.exit(1);
  });
}

export { startServer };
