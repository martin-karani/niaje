// src/graphql/schema.ts
import * as schema from "@/db/schema";
import { SUBSCRIPTION_PLANS } from "@/subscription/constants";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { DBSchema } from "drizzle-graphql";

// Define subscription type definitions
const subscriptionTypeDefs = `
  type TrialInfo {
    onTrial: Boolean!
    daysRemaining: Int!
    expiresAt: String
    isExpired: Boolean!
  }

  type SubscriptionLimits {
    maxProperties: Int!
    maxUsers: Int!
  }

  type SubscriptionInfo {
    active: Boolean!
    plan: String
    status: String!
    limits: SubscriptionLimits!
  }

  type SubscriptionPlan {
    id: String!
    name: String!
    description: String!
    maxProperties: Int!
    maxUsers: Int!
    monthlyPrice: Float!
    yearlyPrice: Float!
    features: [String!]!
  }

  type CardCheckoutSession {
    url: String!
  }
  
  type MpesaPaymentResult {
    transactionId: String!
    flwRef: String!
    status: String!
    message: String!
  }

  extend type Organization {
    trial: TrialInfo
    subscription: SubscriptionInfo
  }

  extend type Query {
    subscriptionPlans: [SubscriptionPlan!]!
    subscriptionStatus(organizationId: ID): SubscriptionStatusInfo!
  }

  type SubscriptionStatusInfo {
    onTrial: Boolean!
    trialDaysRemaining: Int!
    subscriptionActive: Boolean!
    subscriptionPlan: String!
    limits: SubscriptionLimits!
  }

  extend type Mutation {
    createCardCheckout(
      organizationId: ID!,
      planId: String!,
      billingInterval: String!
    ): CardCheckoutSession!
    
    createMpesaPayment(
      organizationId: ID!,
      planId: String!,
      billingInterval: String!,
      phoneNumber: String!
    ): MpesaPaymentResult!
    
    verifyPayment(
      transactionId: String!
    ): Boolean!
  }
`;

// Generate Drizzle GraphQL schema
const dbSchema = new DBSchema(schema, "public");
const drizzleSchema = dbSchema.schema();

// Create the final schema by combining them
export const graphqlSchema = makeExecutableSchema({
  typeDefs: [drizzleSchema.typeDefs, subscriptionTypeDefs],
  resolvers: {
    ...drizzleSchema.resolvers,
    Organization: {
      ...drizzleSchema.resolvers.Organization,
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
      ...drizzleSchema.resolvers.Query,
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
      ...drizzleSchema.resolvers.Mutation,
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
  },
});
