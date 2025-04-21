import { paymentsService } from "@/domains/billing/services/payments.service";
import { subscriptionService } from "@/domains/billing/services/subscription.service";
import emailService from "@/infrastructure/email/email.service";
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
    // Store original payload for logging
    const originalPayload = req.body;
    const webhookType = req.headers["x-korapay-event"] as string;

    // Log webhook receipt
    console.log(`Webhook received from Korapay: ${webhookType}`);

    // Verify webhook signature for security
    const isValid = verifyWebhookSignature(req);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Unauthorized: Invalid signature" });
    }

    // Process the payload
    const payload = req.body;

    // Handle different event types
    switch (webhookType) {
      case "charge.success":
        await handleSuccessfulPayment(payload);
        break;
      case "charge.failed":
        await handleFailedPayment(payload);
        break;
      case "subscription.created":
        await handleSubscriptionCreated(payload);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(payload);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(payload);
        break;
      case "subscription.payment.success":
        await handleSubscriptionPaymentSuccess(payload);
        break;
      case "subscription.payment.failed":
        await handleSubscriptionPaymentFailed(payload);
        break;
      case "refund.processed":
        await handleRefundProcessed(payload);
        break;
      default:
        console.log(`Unhandled webhook event: ${webhookType}`);
    }

    // Acknowledge receipt of the webhook
    res.status(200).json({ received: true });
  } catch (error) {
    // Log the error
    console.error("Error processing Korapay webhook:", error);

    // Optional: Report to error tracking service
    // Sentry.captureException(error);

    // Always return 200 to Korapay to prevent retries, even for errors
    // This is a common pattern for webhooks to prevent duplicate processing
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

/**
 * Verify webhook signature for authenticity
 */
function verifyWebhookSignature(req: Request): boolean {
  try {
    const secretKey = process.env.KORAPAY_SECRET_KEY;
    // Retrieve the signature from Kora's header
    const signature = req.headers["x-korapay-signature"] as string;

    if (!signature || !secretKey) {
      console.error("Missing signature or secret key");
      return false;
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawBody)
      .digest("hex");

    return computedSignature === signature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Handle successful payment event
 */
async function handleSuccessfulPayment(payload: any): Promise<void> {
  try {
    if (payload.data?.status !== "success") {
      console.warn("Payment status is not success in charge.success event");
      return;
    }

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

        // Send confirmation email to organization owner
        if (meta.ownerEmail) {
          await emailService.sendSubscriptionConfirmationEmail(
            meta.ownerEmail,
            meta.ownerName || "Customer",
            meta.organizationName || "Your organization",
            meta.planName || "Subscription plan"
          );
        }

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

        // Record the payment in the system
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

        // Send payment confirmation to tenant
        if (meta.tenantEmail) {
          // This could be a custom email for payment confirmation
          await emailService.sendEmail({
            to: meta.tenantEmail,
            subject: "Payment Confirmation",
            html: `<p>Hello ${meta.tenantName || "Tenant"},</p>
                  <p>Your payment of ${payload.data.currency || "KES"} ${payload.data.amount} has been successfully processed.</p>
                  <p>Transaction Reference: ${transactionId}</p>
                  <p>Thank you for your payment.</p>`,
          });
        }

        console.log(
          `Tenant payment processed for tenant ${meta.tenantId}, lease ${meta.leaseId}`
        );
        break;

      case "expense_payment":
        // Process expense payment
        if (!meta.organizationId || !meta.expenseId) {
          throw new Error(
            "Missing required metadata: organizationId or expenseId"
          );
        }

        // Update expense payment status
        // This would be implemented in your expenses service
        console.log(`Expense payment processed for expense ${meta.expenseId}`);
        break;

      default:
        console.warn(`Unknown payment type in metadata: ${meta.type}`);
    }
  } catch (error) {
    console.error("Error processing successful payment:", error);
    throw error; // Re-throw to be caught by the main handler
  }
}

/**
 * Handle failed payment event
 */
async function handleFailedPayment(payload: any): Promise<void> {
  try {
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
      // Update payment status to failed
      await paymentsService.updatePaymentByReference(
        payload.data.reference,
        meta.organizationId,
        {
          status: "failed",
          processorResponse: payload.data,
        }
      );

      // Notify tenant of failed payment
      if (meta.tenantEmail) {
        await emailService.sendEmail({
          to: meta.tenantEmail,
          subject: "Payment Failed",
          html: `<p>Hello ${meta.tenantName || "Tenant"},</p>
                <p>Your payment of ${payload.data.currency || "KES"} ${payload.data.amount} has failed.</p>
                <p>Reason: ${payload.data?.failure_reason || "Unknown reason"}</p>
                <p>Please try again or contact support for assistance.</p>`,
        });
      }
    } else if (meta.type === "subscription" && meta.organizationId) {
      // Handle failed subscription payment
      await subscriptionService.handlePaymentFailure(
        meta.organizationId,
        payload.data?.failure_reason || "Unknown reason"
      );

      // Notify organization owner
      if (meta.ownerEmail) {
        await emailService.sendEmail({
          to: meta.ownerEmail,
          subject: "Subscription Payment Failed",
          html: `<p>Hello ${meta.ownerName || "Customer"},</p>
                <p>Your subscription payment of ${payload.data.currency || "KES"} ${payload.data.amount} has failed.</p>
                <p>Reason: ${payload.data?.failure_reason || "Unknown reason"}</p>
                <p>Please update your payment method to avoid service interruption.</p>`,
        });
      }
    }
  } catch (error) {
    console.error("Error handling failed payment:", error);
    throw error;
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(payload: any): Promise<void> {
  try {
    const meta = payload.data?.metadata || {};
    if (!meta.organizationId) {
      console.warn("Missing organizationId in subscription.created event");
      return;
    }

    // Update organization with subscription details
    await subscriptionService.updateSubscriptionDetails(meta.organizationId, {
      subscriptionId: payload.data?.id,
      subscriptionStatus: "active",
      subscriptionPlan: meta.planId,
    });

    console.log(`Subscription created for organization ${meta.organizationId}`);
  } catch (error) {
    console.error("Error handling subscription created:", error);
    throw error;
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(payload: any): Promise<void> {
  try {
    const meta = payload.data?.metadata || {};
    if (!meta.organizationId) {
      console.warn("Missing organizationId in subscription.updated event");
      return;
    }

    // Update organization subscription details
    await subscriptionService.updateSubscriptionDetails(meta.organizationId, {
      subscriptionPlan: meta.planId,
      // Any other details that might have changed
    });

    console.log(`Subscription updated for organization ${meta.organizationId}`);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
    throw error;
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(payload: any): Promise<void> {
  try {
    const meta = payload.data?.metadata || {};
    if (!meta.organizationId) {
      console.warn("Missing organizationId in subscription.cancelled event");
      return;
    }

    // Update organization subscription status
    await subscriptionService.handleSubscriptionCancellation(
      meta.organizationId
    );

    // Notify organization owner
    if (meta.ownerEmail) {
      await emailService.sendEmail({
        to: meta.ownerEmail,
        subject: "Subscription Cancelled",
        html: `<p>Hello ${meta.ownerName || "Customer"},</p>
              <p>Your subscription has been cancelled.</p>
              <p>If this was not intended, please contact our support team.</p>`,
      });
    }

    console.log(
      `Subscription cancelled for organization ${meta.organizationId}`
    );
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
    throw error;
  }
}

/**
 * Handle subscription payment success event
 */
async function handleSubscriptionPaymentSuccess(payload: any): Promise<void> {
  try {
    const meta = payload.data?.metadata || {};
    if (!meta.organizationId) {
      console.warn(
        "Missing organizationId in subscription.payment.success event"
      );
      return;
    }

    // Update organization subscription status if needed
    await subscriptionService.updateSubscriptionStatus(
      meta.organizationId,
      "active"
    );

    console.log(
      `Subscription payment success for organization ${meta.organizationId}`
    );
  } catch (error) {
    console.error("Error handling subscription payment success:", error);
    throw error;
  }
}

/**
 * Handle subscription payment failed event
 */
async function handleSubscriptionPaymentFailed(payload: any): Promise<void> {
  try {
    const meta = payload.data?.metadata || {};
    if (!meta.organizationId) {
      console.warn(
        "Missing organizationId in subscription.payment.failed event"
      );
      return;
    }

    // Update organization subscription status
    await subscriptionService.updateSubscriptionStatus(
      meta.organizationId,
      "past_due"
    );

    // Notify organization owner
    if (meta.ownerEmail) {
      await emailService.sendEmail({
        to: meta.ownerEmail,
        subject: "Subscription Payment Failed",
        html: `<p>Hello ${meta.ownerName || "Customer"},</p>
              <p>Your recent subscription payment has failed.</p>
              <p>Please update your payment method to avoid service interruption.</p>`,
      });
    }

    console.log(
      `Subscription payment failed for organization ${meta.organizationId}`
    );
  } catch (error) {
    console.error("Error handling subscription payment failure:", error);
    throw error;
  }
}

/**
 * Handle refund processed event
 */
async function handleRefundProcessed(payload: any): Promise<void> {
  try {
    const originalTransactionId = payload.data?.original_reference;
    if (!originalTransactionId) {
      console.warn("Missing original_reference in refund.processed event");
      return;
    }

    // Update payment status to refunded
    // This would need to be implemented in your payments service
    console.log(`Refund processed for transaction ${originalTransactionId}`);
  } catch (error) {
    console.error("Error handling refund processed:", error);
    throw error;
  }
}
