import { paymentsService } from "@/services/features/payments.service";
import { subscriptionService } from "@/services/system/subscription.service";
import crypto from "crypto";
import { Request, Response } from "express";

/**
 * Handle webhooks from Kora payment processor
 */
export async function handleKorapayWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const secretKey = process.env.KORAPAY_SECRET_KEY;
  // Retrieve the signature from Kora's header
  const signature = req.headers["x-korapay-signature"];

  if (!signature || !secretKey) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing signature or secret key" });
  }

  try {
    // Compute the expected signature based on the "data" field in the body
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(JSON.stringify(req.body.data))
      .digest("hex");

    if (computedSignature !== signature) {
      // The request did not come from Kora
      return res.status(401).json({ error: "Unauthorized: Invalid signature" });
    }

    // Process the payload
    const payload = req.body;
    console.log("Kora webhook received:", payload);

    // Handle events based on the "event" field in the payload
    if (
      payload.event === "charge.success" &&
      payload.data?.status === "success"
    ) {
      // Extract necessary data (use "reference" from Kora payload)
      const transactionId = payload.data.reference;

      // Retrieve metadata (passed during transaction initialization)
      const meta = payload.data.metadata || {};

      if (meta.type === "subscription") {
        const { organizationId, planId } = meta;
        // Process subscription payment
        await subscriptionService.handlePaymentSuccess(
          transactionId,
          organizationId,
          planId
        );
        console.log(
          `Subscription payment processed for organization ${organizationId}`
        );
      } else if (meta.type === "tenant_payment") {
        // Process tenant payment
        const {
          organizationId,
          propertyId,
          unitId,
          leaseId,
          tenantId,
          paymentType,
        } = meta;

        await paymentsService.recordPayment({
          organizationId,
          propertyId,
          unitId,
          leaseId,
          tenantId,
          type: paymentType || "rent",
          method: "korapay", // Updated method name to reflect Kora integration
          amount: payload.data.amount,
          description: `Payment via ${payload.data.payment_method || "korapay"}`,
          transactionDate: new Date(),
          recordedBy: tenantId, // Assuming the tenant is the one making the payment
          referenceId: transactionId,
          processorResponse: payload.data,
        });

        console.log(
          `Tenant payment processed for tenant ${tenantId}, lease ${leaseId}`
        );
      }
    } else if (payload.event === "subscription.cancelled") {
      // Handle subscription cancellation
      if (payload.data?.metadata?.organizationId) {
        const organizationId = payload.data.metadata.organizationId;
        await subscriptionService.handleSubscriptionCancellation(
          organizationId
        );
        console.log(
          `Subscription cancelled for organization ${organizationId}`
        );
      }
    }
  } catch (error) {
    console.error("Error processing Kora webhook:", error);
    // Return 200 so Kora does not retry, while logging the error for review
    return res.status(200).json({ received: true });
  }

  // Acknowledge receipt of the event
  res.status(200).json({ received: true });
}
