import { subscriptionService } from "@/services/subscription.service";
import { Request, Response } from "express";

export async function handleFlutterwaveWebhook(req: Request, res: Response) {
  // Verify webhook signature
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers["verif-hash"];

  if (!signature || signature !== secretHash) {
    // This request isn't from Flutterwave
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Retrieve the request's body
  const payload = req.body;

  // Handle events
  if (
    payload.event === "charge.completed" &&
    payload.data.status === "successful"
  ) {
    try {
      // Extract necessary data
      const { id: transactionId } = payload.data;
      const { organizationId, planId } = payload.data.meta;

      // Process the payment
      await subscriptionService.handlePaymentSuccess(
        transactionId,
        organizationId,
        planId
      );

      console.log(
        `Payment processed successfully for organization ${organizationId}`
      );
    } catch (error) {
      console.error("Error processing webhook payment:", error);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
