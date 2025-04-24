// src/infrastructure/graphql/context/context-provider.ts

import { subscriptionService } from "@/domains/billing/services/subscription.service";
import { PermissionChecker } from "@/infrastructure/auth/permission-checker";
import { Request } from "express";
import { GraphQLContext } from "./types";

/**
 * Create the GraphQL context from the request
 * This provides auth information and permission checks to all resolvers
 */
export async function createGraphQLContext(
  request: Request
): Promise<GraphQLContext> {
  // Extract user and organization from request (set by auth middleware)
  const user = request.user || null;
  const organization = request.activeOrganization || null;
  const team = request.activeTeam || null;

  // Get subscription features based on organization plan
  const features = organization
    ? await subscriptionService.getSubscriptionFeatures(organization.id)
    : {
        maxProperties: 0,
        maxUsers: 0,
        advancedReporting: false,
        documentStorage: false,
      };

  // Create permission checker instance
  const permissionChecker = new PermissionChecker(user, organization, team);

  return {
    user,
    organization,
    team,
    features,
    permissionChecker,
    req: request,
  };
}
