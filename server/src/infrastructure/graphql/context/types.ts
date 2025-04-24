import { PermissionChecker } from "@/infrastructure/auth/permission-checker";
import { Request } from "express";

/**
 * GraphQL Context Type Definition
 * This is passed to all resolvers
 */
export interface GraphQLContext {
  /**
   * The current authenticated user
   */
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  } | null;

  /**
   * The active organization
   */
  organization?: {
    id: string;
    name: string;
    slug: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    agentOwnerId?: string;
    trialStatus?: string;
    trialExpiresAt?: Date;
  } | null;

  /**
   * The active team (if any)
   */
  team?: {
    id: string;
    name: string;
    organizationId: string;
  } | null;

  /**
   * Subscription features based on the organization's plan
   */
  features: {
    maxProperties: number;
    maxUsers: number;
    advancedReporting: boolean;
    documentStorage: boolean;
  };

  /**
   * Permission checker for authorization
   */
  permissionChecker: PermissionChecker;

  /**
   * The original Express request
   */
  req: Request;
}
