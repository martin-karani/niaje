import { subscriptionService } from "@/domains/billing/services/subscription.service";
import { AC } from "@/infrastructure/auth/better-auth/access-control";
import { determinePermissions } from "@/infrastructure/auth/middleware";
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

  // Get permissions based on user role, organization, and team
  const permissions = await determinePermissions(user, organization, team);

  // Get subscription features based on organization plan
  const features = organization
    ? await subscriptionService.getSubscriptionFeatures(organization.id)
    : {
        maxProperties: 0,
        maxUsers: 0,
        advancedReporting: false,
        documentStorage: false,
      };

  // Create access control instance for fine-grained permission checks
  const ac = new AC(user, organization, team);

  return {
    user,
    organization,
    team,
    permissions,
    features,
    ac, // Add AC instance for permission checks in resolvers
  };
}
