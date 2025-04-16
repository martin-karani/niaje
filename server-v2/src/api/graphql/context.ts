import { subscriptionService } from "@/services/system/subscription.service";
import { trialService } from "@/services/system/trial.service";

export interface GraphQLContext {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: any;
  };
  activeOrganization?: {
    id: string;
    name: string;
    [key: string]: any;
  };
  services: {
    trialService: typeof trialService;
    subscriptionService: typeof subscriptionService;
  };
}

export function createContext(request: any): GraphQLContext {
  // Extract user from request (set by auth middleware)
  const user = request.user;
  const activeOrganization = request.activeOrganization;

  return {
    user,
    activeOrganization,
    services: {
      trialService,
      subscriptionService,
    },
  };
}
