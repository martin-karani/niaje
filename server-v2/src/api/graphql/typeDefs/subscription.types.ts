// src/api/graphql/typeDefs/subscription.types.ts
export const subscriptionTypeDefs = `
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
