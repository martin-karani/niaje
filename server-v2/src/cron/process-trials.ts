import { trialService } from "@/services/system/trial.service";

async function processTrials() {
  console.log("Processing expired trials...");
  try {
    await trialService.processExpiredTrials();
    console.log("Trial processing completed successfully");
  } catch (error) {
    console.error("Error processing trials:", error);
  }
}

// Run the script
if (require.main === module) {
  processTrials()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { processTrials };
