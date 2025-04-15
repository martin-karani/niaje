// src/server.ts
import dotenv from "dotenv";
import cron from "node-cron";
import { setupApi } from "./api";
import { processTrials } from "./scripts/process-trials";

// Load environment variables
dotenv.config();

// Configure and start the server
async function startServer() {
  const PORT = process.env.PORT || 3001;
  const app = setupApi();

  // Set up cron job to process trials (runs at midnight)
  cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled trial processing...");
    await processTrials();
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/api/graphql`);
    console.log(`Auth endpoint: http://localhost:${PORT}/api/auth`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
