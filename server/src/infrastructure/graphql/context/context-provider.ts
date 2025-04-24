import { PermissionChecker } from "@/domains/auth/permission-checker";
import { Request } from "express";
import { GraphQLContext } from "./types";

/**
 * Create the GraphQL context from the request
 * This provides auth information and permission checks to all resolvers
 *
 * The auth middleware has already populated the request with user, organization, and permission data
 */
export async function createGraphQLContext(
  request: Request
): Promise<GraphQLContext> {
  // Extract user and organization from request (set by auth middleware)
  const user = request.user || null;
  const organization = request.activeOrganization || null;
  const team = request.activeTeam || null;

  // Get subscription features based on organization plan
  const features = request.features || {
    maxProperties: 0,
    maxUsers: 0,
    advancedReporting: false,
    documentStorage: false,
  };

  // Use permission checker from middleware or create a new one if needed
  const permissionChecker =
    request.permissionChecker ||
    new PermissionChecker(user || null, organization || null, team || null);

  return {
    user,
    organization,
    team,
    features,
    permissionChecker,
    req: request,
  };
}
