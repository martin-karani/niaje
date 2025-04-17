// src/infrastructure/graphql/context/types.ts
export interface GraphQLContext {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  } | null;
  organization?: {
    id: string;
    name: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  permissions: {
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
  features: {
    maxProperties: number;
    maxUsers: number;
    advancedReporting: boolean;
    documentStorage: boolean;
  };
}
