import { paymentsService } from "@/domains/billing/services/payments.service";
import { subscriptionService } from "@/domains/billing/services/subscription.service";
import crypto from "crypto";
import { Request, Response } from "express";

/**
 * Handle webhooks from Korapay payment gateway
 */
export async function handleKorapayWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const secretKey = process.env.KORAPAY_SECRET_KEY;
    // Retrieve the signature from Kora's header
    const signature = req.headers["x-korapay-signature"] as string;

    if (!signature || !secretKey) {
      console.error("Missing signature or secret key");
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing signature or secret key" });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawBody)
      .digest("hex");

    if (computedSignature !== signature) {
      console.error("Invalid signature");
      return res.status(401).json({ error: "Unauthorized: Invalid signature" });
    }

    // Process the payload
    const payload = req.body;
    console.log("Kora webhook received:", JSON.stringify(payload));

    // Handle events based on the event type
    if (
      payload.event === "charge.success" &&
      payload.data?.status === "success"
    ) {
      try {
        // Extract necessary data
        const transactionId = payload.data.reference;
        const meta = payload.data.metadata || {};

        switch (meta.type) {
          case "subscription":
            // Handle subscription payment
            if (!meta.organizationId || !meta.planId) {
              throw new Error(
                "Missing required metadata: organizationId or planId"
              );
            }

            await subscriptionService.handlePaymentSuccess(
              transactionId,
              meta.organizationId,
              meta.planId
            );

            console.log(
              `Subscription payment processed for organization ${meta.organizationId}`
            );
            break;

          case "tenant_payment":
            // Process tenant payment
            if (!meta.organizationId || !meta.tenantId) {
              throw new Error(
                "Missing required metadata: organizationId or tenantId"
              );
            }

            await paymentsService.recordPayment({
              organizationId: meta.organizationId,
              propertyId: meta.propertyId,
              unitId: meta.unitId,
              leaseId: meta.leaseId,
              tenantId: meta.tenantId,
              type: meta.paymentType || "rent",
              method: "korapay",
              amount: payload.data.amount,
              currency: payload.data.currency || "KES",
              transactionDate: new Date(),
              description: `Payment via ${payload.data.payment_method || "Korapay"}`,
              status: "successful",
              recordedBy: meta.tenantId,
              referenceId: transactionId,
              processorResponse: payload.data,
            });

            console.log(
              `Tenant payment processed for tenant ${meta.tenantId}, lease ${meta.leaseId}`
            );
            break;

          default:
            console.warn(`Unknown payment type in metadata: ${meta.type}`);
        }
      } catch (error) {
        console.error("Error processing successful transaction:", error);
        // Log error but still return 200 to prevent webhook retries
      }
    } else if (payload.event === "charge.failed") {
      console.log(
        `Payment failed: ${payload.data?.reference}, reason: ${payload.data?.failure_reason}`
      );

      // Handle failed payment - update any pending records in your system
      const meta = payload.data?.metadata || {};
      if (
        meta.type === "tenant_payment" &&
        meta.organizationId &&
        meta.tenantId
      ) {
        try {
          // Update payment status to failed
          await paymentsService.updatePaymentByReference(
            payload.data.reference,
            meta.organizationId,
            {
              status: "failed",
              processorResponse: payload.data,
            }
          );
        } catch (error) {
          console.error("Error updating failed payment:", error);
        }
      }
    } else if (payload.event === "subscription.cancelled") {
      try {
        // Handle subscription cancellation
        if (payload.data?.metadata?.organizationId) {
          const organizationId = payload.data.metadata.organizationId;
          await subscriptionService.handleSubscriptionCancellation(
            organizationId
          );
          console.log(
            `Subscription cancelled for organization ${organizationId}`
          );
        } else {
          console.warn(
            "Missing organizationId in subscription.cancelled event"
          );
        }
      } catch (error) {
        console.error("Error processing subscription cancellation:", error);
      }
    } else {
      console.log(`Unhandled webhook event: ${payload.event}`);
    }

    // Always acknowledge receipt of the webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing Kora webhook:", error);
    // Return 200 to prevent retries but log the error
    res.status(200).json({
      received: true,
      error: "Processing error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
}
