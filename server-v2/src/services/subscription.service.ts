import { db } from "@/db";
import { member, organization, user } from "@/db/schema";
import {
  createCardPaymentLink,
  createMpesaPayment,
  verifyTransaction,
} from "@/lib/payment";
import { SUBSCRIPTION_PLANS } from "@/subscription/constants";
import { and, eq } from "drizzle-orm";
import { emailService } from "./email.service";
import { trialService } from "./trial.service";

export class SubscriptionService {
  /**
   * Create card payment checkout session
   */
  async createCardCheckout(
    organizationId: string,
    planId: string,
    billingInterval: "month" | "year",
    userId: string
  ): Promise<{ url: string }> {
    // Get organization
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");
    if (!org.customerId) throw new Error("Customer ID not found");

    // Get user info
    const userInfo = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userInfo) throw new Error("User not found");

    // Create card payment link
    return createCardPaymentLink(
      org.customerId,
      planId,
      billingInterval,
      organizationId,
      userInfo.email,
      userInfo.name
    );
  }

  /**
   * Create Mpesa payment
   */
  async createMpesaPayment(
    organizationId: string,
    planId: string,
    billingInterval: "month" | "year",
    userId: string,
    phoneNumber: string
  ): Promise<{
    transactionId: string;
    flwRef: string;
    status: string;
    message: string;
  }> {
    // Get organization
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");

    // Get user info
    const userInfo = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userInfo) throw new Error("User not found");

    // Create Mpesa payment request
    return createMpesaPayment(
      planId,
      billingInterval,
      organizationId,
      userInfo.email,
      userInfo.name,
      phoneNumber
    );
  }

  /**
   * Process a successful payment from any method
   */
  async handlePaymentSuccess(
    transactionId: string,
    organizationId: string,
    planId: string
  ): Promise<void> {
    // Verify the transaction first
    const transaction = await verifyTransaction(transactionId);

    if (transaction.status !== "successful") {
      throw new Error("Transaction not successful");
    }

    // Get organization
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) throw new Error("Invalid plan");

    // Update organization with subscription details
    await db
      .update(organization)
      .set({
        subscriptionStatus: "active",
        subscriptionId: transactionId, // Use transaction ID as subscription ID
        subscriptionPlan: planId,
        maxProperties: plan.maxProperties,
        maxUsers: plan.maxUsers,
        trialStatus: "converted",
        updatedAt: new Date(),
      })
      .where(eq(organization.id, org.id));

    // Find the organization owner for email notification
    const orgOwner = await db.query.member.findFirst({
      where: and(eq(member.organizationId, org.id), eq(member.role, "owner")),
      with: {
        user: true,
      },
    });

    if (orgOwner && orgOwner.user) {
      await emailService.sendSubscriptionConfirmationEmail(
        orgOwner.user.email,
        orgOwner.user.name,
        org.name,
        plan.name
      );
    }
  }

  /**
   * Check if organization has active subscription
   */
  async hasActiveSubscription(organizationId: string): Promise<boolean> {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) return false;

    return org.subscriptionStatus === "active";
  }

  /**
   * Get subscription status with trial info
   */
  async getSubscriptionStatus(organizationId: string): Promise<{
    onTrial: boolean;
    trialDaysRemaining: number;
    subscriptionActive: boolean;
    subscriptionPlan: string;
    limits: {
      maxProperties: number;
      maxUsers: number;
    };
  }> {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");

    const onTrial = await trialService.isInTrial(organizationId);
    const trialDaysRemaining =
      await trialService.getTrialDaysRemaining(organizationId);

    return {
      onTrial,
      trialDaysRemaining,
      subscriptionActive: org.subscriptionStatus === "active",
      subscriptionPlan: org.subscriptionPlan || "none",
      limits: {
        maxProperties: org.maxProperties,
        maxUsers: org.maxUsers,
      },
    };
  }
}

export const subscriptionService = new SubscriptionService();
