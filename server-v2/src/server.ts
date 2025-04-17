import { startScheduler } from "@infrastructure/cron/scheduler";
import { db } from "@infrastructure/database";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { setupApi } from "./api";

dotenv.config();

async function startServer() {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);
    console.log("Database connection successful");

    const PORT = process.env.PORT || 3001;
    const app = setupApi();

    // Start scheduler for background tasks
    startScheduler();

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

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unhandled error during server startup:", error);
    process.exit(1);
  });
}
