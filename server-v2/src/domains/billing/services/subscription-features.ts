import { organizationEntity } from "@/domains/organizations/entities";
import { db } from "@/infrastructure/database";
import { SUBSCRIPTION_PLANS } from "@/shared/constants/subscription-plans";
import { eq } from "drizzle-orm";

/**
 * Get features enabled for an organization based on their subscription plan
 */
export async function getSubscriptionFeatures(organizationId: string): Promise<{
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
