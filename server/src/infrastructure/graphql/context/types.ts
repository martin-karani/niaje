import { AC } from "@/infrastructure/auth/better-auth/access-control";

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
    agentOwnerId?: string;
  } | null;
  team?: {
    id: string;
    name: string;
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
    canViewFinancial: boolean;
    canManageFinancial: boolean;
    canViewDocuments: boolean;
    canManageDocuments: boolean;
    canViewReports: boolean;
    canManageTeams: boolean;
    canInviteUsers: boolean;
  };
  features: {
    maxProperties: number;
    maxUsers: number;
    advancedReporting: boolean;
    documentStorage: boolean;
  };
  ac: AC; // Access Control instance
}
