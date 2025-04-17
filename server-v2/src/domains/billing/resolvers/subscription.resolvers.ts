// src/domains/billing/resolvers/subscription.resolver.ts
import { GraphQLContext } from "@infrastructure/graphql/context/types";
import { SUBSCRIPTION_PLANS } from "@shared/constants/subscription-plans";
import { AuthorizationError } from "@shared/errors/authorization.error";
import {
  CreateCardCheckoutDto,
  CreateMpesaPaymentDto,
  SubscriptionStatusDto,
  VerifyPaymentDto,
} from "../dto/subscription.dto";
import { paymentGatewayService } from "../services/payment-gateway.service";
import { subscriptionService } from "../services/subscription.service";
import { trialService } from "../services/trial.service";

/**
 * Helper function to check subscription permissions
 */
function checkSubscriptionPermissions(
  context: GraphQLContext,
  organizationId?: string
): { userId: string; organizationId: string } {
  const { user, organization, permissions } = context;

  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  // If organizationId is provided, use that, otherwise use active organization
  const targetOrgId = organizationId || organization?.id;

  if (!targetOrgId) {
    throw new Error("No organization specified");
  }

  // Only org owners or users with subscription management permissions can manage subscriptions
  // For viewing plans and creating checkouts, we're more lenient

  return { userId: user.id, organizationId: targetOrgId };
}

export const subscriptionResolvers = {
  Organization: {
    trial: async (organization: any, _: any, context: GraphQLContext) => {
      const isInTrial = await trialService.isInTrial(organization.id);
      const daysRemaining = await trialService.getTrialDaysRemaining(
        organization.id
      );

      return {
        onTrial: isInTrial,
        daysRemaining,
        expiresAt: organization.trialExpiresAt,
        isExpired: organization.trialStatus === "expired",
      };
    },

    subscription: async (organization: any) => {
      return {
        active: organization.subscriptionStatus === "active",
        plan: organization.subscriptionPlan,
        status: organization.subscriptionStatus,
        limits: {
          maxProperties: organization.maxProperties,
          maxUsers: organization.maxUsers,
        },
      };
    },
  },

  Query: {
    subscriptionPlans: () => {
      return Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
        id,
        ...plan,
      }));
    },

    subscriptionStatus: async (
      _: any,
      { organizationId }: SubscriptionStatusDto,
      context: GraphQLContext
    ) => {
      const { organizationId: targetOrgId } = checkSubscriptionPermissions(
        context,
        organizationId
      );

      return subscriptionService.getSubscriptionStatus(targetOrgId);
    },
  },

  Mutation: {
    createCardCheckout: async (
      _: any,
      { organizationId, planId, billingInterval }: CreateCardCheckoutDto,
      context: GraphQLContext
    ) => {
      const { userId } = checkSubscriptionPermissions(context, organizationId);

      return subscriptionService.createCardCheckout(
        organizationId,
        planId,
        billingInterval,
        userId
      );
    },

    createMpesaPayment: async (
      _: any,
      {
        organizationId,
        planId,
        billingInterval,
        phoneNumber,
      }: CreateMpesaPaymentDto,
      context: GraphQLContext
    ) => {
      const { userId } = checkSubscriptionPermissions(context, organizationId);

      return subscriptionService.createMpesaPayment(
        organizationId,
        planId,
        billingInterval,
        userId,
        phoneNumber
      );
    },

    verifyPayment: async (
      _: any,
      { transactionId }: VerifyPaymentDto,
      _context: GraphQLContext
    ) => {
      try {
        const result =
          await paymentGatewayService.verifyTransaction(transactionId);

        if (result.status === "successful" && result.meta) {
          // Extract metadata from transaction
          const { organizationId, planId } = result.meta;

          // Process the successful payment
          await subscriptionService.handlePaymentSuccess(
            transactionId,
            organizationId,
            planId
          );

          return true;
        }

        return false;
      } catch (error) {
        console.error("Error verifying payment:", error);
        return false;
      }
    },
  },
};
