import { Request, Response } from "express";
import { handleKorapayWebhook } from "./korapay";

/**
 * Main webhook handler that routes to specific provider handlers
 */
export async function handleWebhooks(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const provider = req.params.provider.toLowerCase();

    // Route webhook to appropriate handler based on provider
    switch (provider) {
      case "korapay":
        await handleKorapayWebhook(req, res);
        break;
      case "flutterwave":
        // Placeholder for future implementation
        res.status(200).json({
          received: true,
          message: "Flutterwave webhook received but not yet implemented",
        });
        break;
      default:
        console.warn(`Unknown webhook provider: ${provider}`);
        res.status(400).json({ error: "Unknown webhook provider" });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Always return 200 to prevent retries, but log the error
    res.status(200).json({
      received: true,
      error: "Error processing webhook",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
}
