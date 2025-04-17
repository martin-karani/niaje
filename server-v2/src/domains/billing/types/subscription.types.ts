// src/domains/billing/types/subscription.types.ts

export const subscriptionTypeDefs = `
  # Trial information
  type TrialInfo {
    onTrial: Boolean!
    daysRemaining: Int!
    expiresAt: String
    isExpired: Boolean!
  }

  # Subscription information
  type SubscriptionInfo {
    active: Boolean!
    plan: String
    status: String!
    limits: SubscriptionLimits!
  }

  # Subscription limits
  type SubscriptionLimits {
    maxProperties: Int!
    maxUsers: Int!
  }

  # Subscription plan details
  type SubscriptionPlan {
    id: ID!
    name: String!
    description: String!
    features: [String!]!
    monthlyPrice: Float!
    yearlyPrice: Float!
    maxProperties: Int!
    maxUsers: Int!
    isPopular: Boolean
  }

  # Card checkout response
  type CardCheckoutResponse {
    url: String!
  }

  # Mpesa payment response
  type MpesaPaymentResponse {
    transactionId: String!
    koraRef: String!
    status: String!
    message: String!
  }

  # Subscription status response
  type SubscriptionStatusResponse {
    onTrial: Boolean!
    trialDaysRemaining: Int!
    subscriptionActive: Boolean!
    subscriptionPlan: String!
    limits: SubscriptionLimits!
  }

  # Add fields to the Organization type
  extend type Organization {
    trial: TrialInfo!
    subscription: SubscriptionInfo!
  }

  # Extend Query type with subscription queries
  extend type Query {
    subscriptionPlans: [SubscriptionPlan!]!
    subscriptionStatus(organizationId: ID): SubscriptionStatusResponse!
  }

  # Extend Mutation type with subscription mutations
  extend type Mutation {
    createCardCheckout(
      organizationId: ID!
      planId: ID!
      billingInterval: String!
    ): CardCheckoutResponse!

    createMpesaPayment(
      organizationId: ID!
      planId: ID!
      billingInterval: String!
      phoneNumber: String!
    ): MpesaPaymentResponse!

    verifyPayment(
      transactionId: ID!
    ): Boolean!
  }
`;
