import { getSubscriptionFeatures } from "@/domains/billing/services/subscription.service";
import { determinePermissions } from "@/infrastructure/auth/permissions";
import { Request } from "express";
import { GraphQLContext } from "./types";

export async function createGraphQLContext(
  request: Request
): Promise<GraphQLContext> {
  const user = request.user || null;
  const organization = request.activeOrganization || null;
  const team = request.activeTeam || null;
  const tenant = request.activeTenant || null;

  const permissions = determinePermissions(user, organization, team) as {
    canViewProperties: boolean;
    canManageProperties: boolean;
    canDeleteProperties: boolean;
    canViewTenants: boolean;
    canManageTenants: boolean;
    canViewLeases: boolean;
    canManageLeases: boolean;
    canViewMaintenance: boolean;
    canManageMaintenance: boolean;
    canManageUsers: boolean;
    canManageSubscription: boolean;
  };

  const features = organization
    ? await getSubscriptionFeatures(organization.id)
    : {
        maxProperties: 0,
        maxUsers: 0,
        advancedReporting: false,
        documentStorage: false,
      };

  return {
    user,
    organization,
    team,
    tenant,
    permissions,
    features,
  };
}
