import { billingResolvers } from "@/domains/billing/resolvers/billings.resolvers";
import { subscriptionResolvers } from "@/domains/billing/resolvers/subscription.resolvers";
import { billingTypeDefs } from "@/domains/billing/types/billing.type";
import { subscriptionTypeDefs } from "@/domains/billing/types/subscription.types";
import { leasesResolvers } from "@/domains/leases/resolvers/leases.resolver";
import { leasesTypeDefs } from "@/domains/leases/types/leases.types";
import { maintenanceResolvers } from "@/domains/maintenance/resolvers/maintenance.resolver";
import { maintenanceTypeDefs } from "@/domains/maintenance/types/maintenace.types";
import { organizationsResolvers } from "@/domains/organizations/resolvers/organizations.resolver";
import { organizationsTypeDefs } from "@/domains/organizations/types/organizations.type";
import { propertiesResolvers } from "@/domains/properties/resolvers/properties.resolver";
import { propertiesTypeDefs } from "@/domains/properties/types/properties.types";
import { tenantsResolvers } from "@/domains/tenants/resolvers/tenants.resolver";
import { tenantsTypeDefs } from "@/domains/tenants/types/tenants.types";
import { usersTypeDefs } from "@/domains/users/types/users.types";
import { makeExecutableSchema } from "@graphql-tools/schema";

// Base types that can be extended
const baseTypeDefs = `
  type Query {
    _empty: String
    hello: String
  }
  
  type Mutation {
    _empty: String
  }
`;

// Combine all typeDefs
const typeDefs = [
  baseTypeDefs,
  propertiesTypeDefs,
  tenantsTypeDefs,
  leasesTypeDefs,
  organizationsTypeDefs,
  maintenanceTypeDefs,
  subscriptionTypeDefs,
  usersTypeDefs,
  billingTypeDefs,
  communicationsTypeDefs,
];

// Merge all resolvers
const resolvers = {
  Query: {
    hello: () => "Hello from Property Management API!",
    ...propertiesResolvers.Query,
    ...tenantsResolvers.Query,
    ...leasesResolvers.Query,
    ...organizationsResolvers.Query,
    ...maintenanceResolvers.Query,
    ...subscriptionResolvers.Query,
    ...billingResolvers.Query,
  },
  Mutation: {
    ...propertiesResolvers.Mutation,
    ...tenantsResolvers.Mutation,
    ...leasesResolvers.Mutation,
    ...organizationsResolvers.Mutation,
    ...maintenanceResolvers.Mutation,
    ...subscriptionResolvers.Mutation,
    ...billingResolvers.Mutation,
  },
  // Type resolvers
  Property: propertiesResolvers.Property,
  Tenant: tenantsResolvers.Tenant,
  Lease: leasesResolvers.Lease,
  Organization: {
    ...organizationsResolvers.Organization,
    ...subscriptionResolvers.Organization,
  },
  MaintenanceRequest: maintenanceResolvers.MaintenanceRequest,
};

// Create executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
