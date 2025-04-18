import {
  memberEntity,
  organizationEntity,
} from "@/domains/organizations/entities/organization.entity";
import { userEntity } from "@/domains/users/entities";
import { db } from "@/infrastructure/database";
import { EmailService } from "@/infrastructure/email/email.service";
import { SUBSCRIPTION_PLANS } from "@/shared/constants/subscription-plans";
import { and, eq } from "drizzle-orm";
import { paymentGatewayService } from "./payment-gateway.service";

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
   * Get features enabled for an organization based on their subscription plan
   */

  async getSubscriptionFeatures(organizationId: string): Promise<{
    maxProperties: number;
    maxUsers: number;
    advancedReporting: boolean;
    documentStorage: boolean;
  }> {
    // Default features (free tier)
    const defaultFeatures = {
      maxProperties: 5,
      maxUsers: 3,
      advancedReporting: false,
      documentStorage: false,
    };

    try {
      // Get organization subscription details
      const organization = await db.query.organizationEntity.findFirst({
        where: eq(organizationEntity.id, organizationId),
      });

      if (!organization) {
        console.warn(`Organization not found: ${organizationId}`);
        return defaultFeatures;
      }

      // If on a trial, provide basic features
      if (organization.trialStatus === "active") {
        return {
          maxProperties: organization.maxProperties || 5,
          maxUsers: organization.maxUsers || 3,
          advancedReporting: false,
          documentStorage: true,
        };
      }

      // If subscription is active, get features from subscription plan
      if (
        organization.subscriptionStatus === "active" &&
        organization.subscriptionPlan
      ) {
        const planKey =
          organization.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS;
        const plan = SUBSCRIPTION_PLANS[planKey];

        if (plan) {
          return {
            maxProperties: organization.maxProperties || plan.maxProperties,
            maxUsers: organization.maxUsers || plan.maxUsers,
            advancedReporting: planKey !== "basic", // Standard and above
            documentStorage: true, // All paid plans have document storage
          };
        }
      }

      // Default to organization limits or default features
      return {
        maxProperties:
          organization.maxProperties || defaultFeatures.maxProperties,
        maxUsers: organization.maxUsers || defaultFeatures.maxUsers,
        advancedReporting: false,
        documentStorage: false,
      };
    } catch (error) {
      console.error(
        `Error getting subscription features for ${organizationId}:`,
        error
      );
      return defaultFeatures;
    }
  }
}

// Create and export singleton instance
export const subscriptionService = new SubscriptionService(new EmailService());
