import { db } from "@/db";
import { makeExecutableSchema, mergeSchemas } from "@graphql-tools/schema";
import { buildSchema } from "drizzle-graphql";
import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { propertiesResolvers } from "./resolvers/properties.resolvers";
import { subscriptionResolvers } from "./resolvers/subscription.resolvers";
import { propertiesTypeDefs } from "./typeDefs/properties.types";
import { subscriptionTypeDefs } from "./typeDefs/subscription.types";

// Enhanced helper function to create a schema from selected entities with renaming support
type SelectiveSchemaOptions = {
  includeQueries?: string[];
  includeMutations?: string[];
  excludeQueries?: string[];
  excludeMutations?: string[];
  renameQueries?: Record<string, string>;
  renameMutations?: Record<string, string>;
};

function createSelectiveSchema(
  entities: {
    queries: Record<string, any>;
    mutations: Record<string, any>;
    types: Record<string, any>;
    inputs: Record<string, any>;
  },
  options: SelectiveSchemaOptions = {}
) {
  const {
    includeQueries = [],
    includeMutations = [],
    excludeQueries = [],
    excludeMutations = [],
    renameQueries = {}, // Object mapping original names to new names
    renameMutations = {}, // Object mapping original names to new names
  } = options;

  // Filter and rename queries
  const queryFields: { [key: string]: any } = {};
  Object.entries(entities.queries).forEach(([originalName, query]) => {
    // Check if this query should be included
    if (
      (includeQueries.length === 0 || includeQueries.includes(originalName)) &&
      !excludeQueries.includes(originalName)
    ) {
      // Get new name if specified, otherwise use original
      const newName = renameQueries[originalName] || originalName;
      queryFields[newName] = query;
    }
  });

  // Filter and rename mutations
  const mutationFields: { [key: string]: any } = {};
  Object.entries(entities.mutations).forEach(([originalName, mutation]) => {
    if (
      (includeMutations.length === 0 ||
        includeMutations.includes(originalName)) &&
      !excludeMutations.includes(originalName)
    ) {
      // Get new name if specified, otherwise use original
      const newName = renameMutations[originalName] || originalName;
      mutationFields[newName] = mutation;
    }
  });

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: queryFields,
    }),
    mutation:
      Object.keys(mutationFields).length > 0
        ? new GraphQLObjectType({
            name: "Mutation",
            fields: mutationFields,
          })
        : undefined,
    types: [
      ...Object.values(entities.types),
      ...Object.values(entities.inputs),
    ],
  });
}

// Get entities from drizzle-graphql
const { entities } = buildSchema(db, {
  relationsDepthLimit: 2,
});

// Create custom schema for your extensions
const customSchema = makeExecutableSchema({
  typeDefs: [
    // Base types
    `
    type Query {
      hello: String
      version: String
    }
    `,
    subscriptionTypeDefs,
    propertiesTypeDefs,
  ],
  resolvers: {
    Query: {
      hello: () => "Hello from Property Management API!",
      version: () => "1.0.0",
      ...subscriptionResolvers.Query,
      ...propertiesResolvers.Query,
    },
    Mutation: {
      ...subscriptionResolvers.Mutation,
      ...propertiesResolvers.Mutation,
    },
    Organization: {
      ...subscriptionResolvers.Organization,
    },
  },
});

// Create selective schema from drizzle entities with renaming
const drizzleSchema = createSelectiveSchema(entities, {
  // Include only specific queries
  includeQueries: [
    "organizations",
    "properties",
    "units",
    "users",
    "tenants",
    "organizationsSingle", // Include this to rename it
    "usersSingle", // Include this to rename it
  ],

  // Exclude queries that conflict with your custom schema
  excludeQueries: ["subscriptionPlans", "subscriptionStatus"],

  // Rename fields as needed
  renameQueries: {
    organizationsSingle: "organization", // Renamed from organizationsSingle to organization
    usersSingle: "user", // Renamed from usersSingle to user
    propertiesSingle: "property", // Renamed from propertiesSingle to property
    unitsSingle: "unit", // Renamed from unitsSingle to unit
  },

  // You can do the same for mutations
  renameMutations: {
    createOrganization: "addOrganization", // Example of renaming a mutation
    updateOrganization: "editOrganization", // Another example
  },
});

// Merge the schemas
export const graphqlSchema = mergeSchemas({
  schemas: [drizzleSchema, customSchema],
});
