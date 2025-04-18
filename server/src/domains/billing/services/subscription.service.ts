import { memberEntity, organizationEntity } from "@/domains/organizations/entities/organization.entity";
import { userEntity } from "@/domains/users/entities";
import { db } from "@/infrastructure/database";
import { EmailService } from "@/infrastructure/email/email.service";
import { SUBSCRIPTION_PLANS } from "@/shared/constants/subscription-plans";
import { and, eq } from "drizzle-orm";
import { paymentGatewayService } from "./payment-gateway.service";
import { trialService } from "./trial.service";

export class SubscriptionService {
  constructor(private emailService: EmailService) {}

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
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");
    if (!org.customerId) throw new Error("Customer ID not found");

    // Get user info
    const userInfo = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });

    if (!userInfo) throw new Error("User not found");

    // Create card payment link
    return paymentGatewayService.createCardPaymentLink(
      org.customerId,
      planId as keyof typeof SUBSCRIPTION_PLANS,
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
    koraRef: string;
    status: string;
    message: string;
  }> {
    // Get organization
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");

    // Get user info
    const userInfo = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });

    if (!userInfo) throw new Error("User not found");

    // Create Mpesa payment request
    return paymentGatewayService.createMpesaPayment(
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
    const transaction =
      await paymentGatewayService.verifyTransaction(transactionId);

    if (transaction.status !== "successful") {
      throw new Error("Transaction not successful");
    }

    // Get organization
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) throw new Error("Invalid plan");

    // Update organization with subscription details
    await db
      .update(organizationEntity)
      .set({
        subscriptionStatus: "active",
        subscriptionId: transactionId, // Use transaction ID as subscription ID
        subscriptionPlan: planId,
        maxProperties: plan.maxProperties,
        maxUsers: plan.maxUsers,
        trialStatus: "converted",
        updatedAt: new Date(),
      })
      .where(eq(organizationEntity.id, org.id));

    // Find the organization owner for email notification
    const orgOwner = await db.query.memberEntity.findFirst({
      where: and(
        eq(memberEntity.organizationId, org.id),
        eq(memberEntity.role, "owner")
      ),
      with: {
        user: true,
      },
    });

    if (orgOwner && orgOwner.user) {
      await this.emailService.sendSubscriptionConfirmationEmail(
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
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
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
    limits: { maxProperties: number; maxUsers: number };
  }> {
    // existing implementation...
  }

  /**
   * Retrieve the feature set for an organization's current plan or trial
   */
  async getSubscriptionFeatures(
    organizationId: string
  ): Promise<{
    planKey: string;
    name: string;
    description: string;
    features: string[];
    pricing?: {
      monthlyPrice: number;
      yearlyPrice: number;
      monthlyPriceId: string;
      yearlyPriceId: string;
    };
    limits: {
      maxProperties: number;
      maxUsers: number;
    };
    trialDaysRemaining?: number;
  }> {
    // Load organization
    const org = await db.query.organizationEntity.findFirst({
      where: eq(organizationEntity.id, organizationId),
    });

    if (!org) throw new Error("Organization not found");

    const onTrial = await trialService.isInTrial(organizationId);
    const trialDaysRemaining =
      await trialService.getTrialDaysRemaining(organizationId);

    return {
      planKey,
      name: plan.name,
      description: plan.description,
      features: plan.features,
      pricing: {
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        monthlyPriceId: plan.monthlyPriceId,
        yearlyPriceId: plan.yearlyPriceId,
      },
      limits: {
        maxProperties: plan.maxProperties,
        maxUsers: plan.maxUsers,
      },
    };
  }
}

// Create and export singleton instance
export const subscriptionService = new SubscriptionService(new EmailService());
