// src/graphql/resolvers/subscription.resolvers.ts
import { verifyTransaction } from "@/lib/payment";
import { SUBSCRIPTION_PLANS } from "@/subscription/constants";

export const subscriptionResolvers = {
  Organization: {
    trial: async (organization, _, { services }) => {
      const { trialService } = services;
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

    subscription: async (organization) => {
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
      _,
      { organizationId },
      { services, user, activeOrganization }
    ) => {
      const { subscriptionService } = services;
      const targetOrgId = organizationId || activeOrganization?.id;

      if (!targetOrgId) {
        throw new Error("No organization specified");
      }

      return subscriptionService.getSubscriptionStatus(targetOrgId);
    },
  },

  Mutation: {
    createCardCheckout: async (
      _,
      { organizationId, planId, billingInterval },
      { services, user }
    ) => {
      const { subscriptionService } = services;

      if (!user) throw new Error("Authentication required");

      return subscriptionService.createCardCheckout(
        organizationId,
        planId,
        billingInterval,
        user.id
      );
    },

    createMpesaPayment: async (
      _,
      { organizationId, planId, billingInterval, phoneNumber },
      { services, user }
    ) => {
      const { subscriptionService } = services;

      if (!user) throw new Error("Authentication required");

      return subscriptionService.createMpesaPayment(
        organizationId,
        planId,
        billingInterval,
        user.id,
        phoneNumber
      );
    },

    verifyPayment: async (_, { transactionId }, { services }) => {
      try {
        const result = await verifyTransaction(transactionId);

        if (result.status === "successful") {
          // Extract metadata from transaction
          const { organizationId, planId } = result.meta;

          // Process the successful payment
          await services.subscriptionService.handlePaymentSuccess(
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
