import { db } from "@/db";
import { buildSchema } from "drizzle-graphql";
// import { applyMiddleware } from "graphql-middleware";

// // Import all type definitions
// import { documentsTypeDefs } from "./typeDefs/documents.types";
// import { inspectionTypeDefs } from "./typeDefs/inspection.types";
// import { leasesTypeDefs } from "./typeDefs/leases.types";
// import { maintenanceTypeDefs } from "./typeDefs/maintenance.types";
// import { paymentsTypeDefs } from "./typeDefs/payments.types";
// import { propertiesTypeDefs } from "./typeDefs/properties.types";
// import { teamsTypeDefs } from "./typeDefs/teams.types";
// import { tenantsTypeDefs } from "./typeDefs/tenants.types";
// import { usersTypeDefs } from "./typeDefs/users.types";

// // Import all resolvers
// import { documentsResolvers } from "./resolvers/documents.resolvers";
// import { leasesResolvers } from "./resolvers/leases.resolvers";
// import { maintenanceResolvers } from "./resolvers/maintenance.resolvers";
// import { paymentsResolvers } from "./resolvers/payments.resolvers";
// import { propertiesResolvers } from "./resolvers/properties.resolvers";
// import { teamsResolvers } from "./resolvers/teams.resolvers";
// import { tenantsResolvers } from "./resolvers/tenants.resolvers";
// import { usersResolvers } from "./resolvers/users.resolvers";

// // Define subscription type definitions
// const subscriptionTypeDefs = `
//   type TrialInfo {
//     onTrial: Boolean!
//     daysRemaining: Int!
//     expiresAt: String
//     isExpired: Boolean!
//   }

//   type SubscriptionLimits {
//     maxProperties: Int!
//     maxUsers: Int!
//   }

//   type SubscriptionInfo {
//     active: Boolean!
//     plan: String
//     status: String!
//     limits: SubscriptionLimits!
//   }

//   type SubscriptionPlan {
//     id: String!
//     name: String!
//     description: String!
//     maxProperties: Int!
//     maxUsers: Int!
//     monthlyPrice: Float!
//     yearlyPrice: Float!
//     features: [String!]!
//   }

//   type CardCheckoutSession {
//     url: String!
//   }

//   type MpesaPaymentResult {
//     transactionId: String!
//     flwRef: String!
//     status: String!
//     message: String!
//   }

//   extend type Organization {
//     trial: TrialInfo
//     subscription: SubscriptionInfo
//   }

//   extend type Query {
//     subscriptionPlans: [SubscriptionPlan!]!
//     subscriptionStatus(organizationId: ID): SubscriptionStatusInfo!
//   }

//   type SubscriptionStatusInfo {
//     onTrial: Boolean!
//     trialDaysRemaining: Int!
//     subscriptionActive: Boolean!
//     subscriptionPlan: String!
//     limits: SubscriptionLimits!
//   }

//   extend type Mutation {
//     createCardCheckout(
//       organizationId: ID!,
//       planId: String!,
//       billingInterval: String!
//     ): CardCheckoutSession!

//     createMpesaPayment(
//       organizationId: ID!,
//       planId: String!,
//       billingInterval: String!,
//       phoneNumber: String!
//     ): MpesaPaymentResult!

//     verifyPayment(
//       transactionId: String!
//     ): Boolean!
//   }
// `;

// // Base Query and Mutation type definitions
// const baseTypeDefs = `
//   type Query {
//     _empty: String
//   }

//   type Mutation {
//     _empty: String
//   }
// `;

// // Create subscription resolvers
// const subscriptionResolvers = {
//   Organization: {
//     trial: async (organization, _, { services }) => {
//       const { trialService } = services;
//       const isInTrial = await trialService.isInTrial(organization.id);
//       const daysRemaining = await trialService.getTrialDaysRemaining(
//         organization.id
//       );

//       return {
//         onTrial: isInTrial,
//         daysRemaining,
//         expiresAt: organization.trialExpiresAt,
//         isExpired: organization.trialStatus === "expired",
//       };
//     },
//     subscription: async (organization) => {
//       return {
//         active: organization.subscriptionStatus === "active",
//         plan: organization.subscriptionPlan,
//         status: organization.subscriptionStatus,
//         limits: {
//           maxProperties: organization.maxProperties,
//           maxUsers: organization.maxUsers,
//         },
//       };
//     },
//   },
//   Query: {
//     subscriptionPlans: () => {
//       return Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
//         id,
//         ...plan,
//       }));
//     },
//     subscriptionStatus: async (
//       _,
//       { organizationId },
//       { services, user, activeOrganization }
//     ) => {
//       const { subscriptionService } = services;
//       const targetOrgId = organizationId || activeOrganization?.id;

//       if (!targetOrgId) {
//         throw new Error("No organization specified");
//       }

//       return subscriptionService.getSubscriptionStatus(targetOrgId);
//     },
//   },
//   Mutation: {
//     createCardCheckout: async (
//       _,
//       { organizationId, planId, billingInterval },
//       { services, user }
//     ) => {
//       const { subscriptionService } = services;

//       if (!user) throw new Error("Authentication required");

//       return subscriptionService.createCardCheckout(
//         organizationId,
//         planId,
//         billingInterval,
//         user.id
//       );
//     },

//     createMpesaPayment: async (
//       _,
//       { organizationId, planId, billingInterval, phoneNumber },
//       { services, user }
//     ) => {
//       const { subscriptionService } = services;

//       if (!user) throw new Error("Authentication required");

//       return subscriptionService.createMpesaPayment(
//         organizationId,
//         planId,
//         billingInterval,
//         user.id,
//         phoneNumber
//       );
//     },

//     verifyPayment: async (_, { transactionId }, { services }) => {
//       try {
//         const result = await verifyTransaction(transactionId);

//         if (result.status === "successful") {
//           // Extract metadata from transaction
//           const { organizationId, planId } = result.meta;

//           // Process the successful payment
//           await services.subscriptionService.handlePaymentSuccess(
//             transactionId,
//             organizationId,
//             planId
//           );

//           return true;
//         }

//         return false;
//       } catch (error) {
//         console.error("Error verifying payment:", error);
//         return false;
//       }
//     },
//   },
// };

// // Merge all type definitions
// const typeDefs = mergeTypeDefs([
//   baseTypeDefs,
//   drizzleSchema.typeDefs,
//   subscriptionTypeDefs,
//   // propertiesTypeDefs,
//   // teamsTypeDefs,
//   // tenantsTypeDefs,
//   // usersTypeDefs,
//   // maintenanceTypeDefs,
//   // inspectionTypeDefs,
//   // leasesTypeDefs,
//   // documentsTypeDefs,
//   // paymentsTypeDefs,
// ]);

// // Merge all resolvers
// const resolvers = mergeResolvers([
//   drizzleSchema.resolvers,
//   subscriptionResolvers,
//   // propertiesResolvers,
//   // teamsResolvers,
//   // tenantsResolvers,
//   // usersResolvers,
//   // maintenanceResolvers,
//   // leasesResolvers,
//   // documentsResolvers,
//   // paymentsResolvers,
// ]);

export const graphqlSchema = buildSchema(db);

// // Create a GraphQL middleware function to check team access
// const checkTeamAccess = async (resolver, parent, args, context, info) => {
//   const { user, activeTeam } = context;

//   // Skip for admin or agent owner roles who have global access
//   if (user?.role === "admin" || user?.role === "agent_owner") {
//     return resolver(parent, args, context, info);
//   }

//   // Get property ID from args
//   const propertyId =
//     args.id || args.propertyId || (args.data && args.data.propertyId);

//   if (!propertyId || !user) {
//     throw new Error("Access denied");
//   }

//   // For agent_staff, check if they're in the team responsible for this property
//   if (user.role === "agent_staff") {
//     if (!activeTeam?.id) {
//       throw new Error("You don't have permission to access this property");
//     }

//     // Get property metadata to check team assignment
//     const property = await db.query.properties.findFirst({
//       where: eq(schema.properties.id, propertyId),
//     });

//     if (!property) {
//       throw new Error("Property not found");
//     }

//     // Check if property is assigned to user's team
//     const propertyMetadata = property.metadata as any;
//     if (
//       !propertyMetadata?.teamId ||
//       propertyMetadata.teamId !== activeTeam.id
//     ) {
//       throw new Error("This property is managed by a different team");
//     }
//   }

//   return resolver(parent, args, context, info);
// };

// const schemaWithMiddleware = applyMiddleware(executableSchema, {
//   "Query.property": checkTeamAccess,
//   "Query.propertiesByTeam": checkTeamAccess,
//   "Query.units": checkTeamAccess,
//   "Query.unit": checkTeamAccess,
//   "Mutation.createProperty": checkTeamAccess,
//   "Mutation.updateProperty": checkTeamAccess,
//   "Mutation.deleteProperty": checkTeamAccess,
//   "Mutation.createUnit": checkTeamAccess,
//   "Mutation.updateUnit": checkTeamAccess,
//   "Mutation.deleteUnit": checkTeamAccess,
//   // Add more resolver paths that need team access checks
// });

// export const graphqlSchema = schemaWithMiddleware;
