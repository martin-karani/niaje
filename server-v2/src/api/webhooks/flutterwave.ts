// src/api/webhooks/flutterwave.ts
import { paymentsService } from "@/services/features/payments.service";
import { subscriptionService } from "@/services/system/subscription.service";
import { Request, Response } from "express";

/**
 * Handle webhooks from Flutterwave payment processor
 */
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

  try {
    // Handle events
    if (
      payload.event === "charge.completed" &&
      payload.data.status === "successful"
    ) {
      // Extract necessary data
      const { id: transactionId } = payload.data;

      // Check if this is a subscription payment or a regular payment
      if (payload.data.meta?.type === "subscription") {
        const { organizationId, planId } = payload.data.meta;

        // Process subscription payment
        await subscriptionService.handlePaymentSuccess(
          transactionId,
          organizationId,
          planId
        );

        console.log(
          `Subscription payment processed for organization ${organizationId}`
        );
      } else if (payload.data.meta?.type === "tenant_payment") {
        // Process tenant payment
        const {
          organizationId,
          propertyId,
          unitId,
          leaseId,
          tenantId,
          paymentType,
        } = payload.data.meta;

        await paymentsService.recordPayment({
          organizationId,
          propertyId,
          unitId,
          leaseId,
          tenantId,
          type: paymentType || "rent",
          method: "mpesa", // Assuming mobile money
          amount: payload.data.amount,
          description: `Payment via ${payload.data.payment_type}`,
          transactionDate: new Date(),
          recordedBy: tenantId, // Tenant made the payment
          referenceId: transactionId,
          processorResponse: payload.data,
        });

        console.log(
          `Tenant payment processed for tenant ${tenantId}, lease ${leaseId}`
        );
      }
    } else if (payload.event === "subscription.cancelled") {
      // Handle subscription cancellation
      if (payload.data.meta?.organizationId) {
        await subscriptionService.handleSubscriptionCancellation(
          payload.data.meta.organizationId
        );

        console.log(
          `Subscription cancelled for organization ${payload.data.meta.organizationId}`
        );
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 so Flutterwave doesn't retry repeatedly
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
