import dotenv from "dotenv";
import { setupApi } from "./api";

// Load environment variables
dotenv.config();

// Configure and start the server
async function startServer() {
  const PORT = process.env.PORT || 3001;
  const app = setupApi();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`TRPC endpoint: http://localhost:${PORT}/api/trpc`);
    console.log(`Auth endpoint: http://localhost:${PORT}/api/auth`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
