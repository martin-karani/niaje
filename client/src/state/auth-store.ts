import { create } from "zustand";
import {
  getSession,
  signIn,
  signOut,
  switchOrganization,
} from "../services/auth";

// User type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

// Organization type
interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
}

// Team type
interface Team {
  id: string;
  name: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  organization: Organization | null;
  organizations: Organization[];
  team: Team | null;
  teams: Team[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setOrganization: (organizationId: string) => Promise<void>;
  setTeam: (teamId: string) => void;
  clearError: () => void;
}

// Create auth store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  organization: null,
  organizations: [],
  team: null,
  teams: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize auth state from session
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await getSession();

      if (session?.user) {
        set({
          user: session.user as User,
          organization: session.activeOrganization as Organization,
          organizations: session.organizations as Organization[],
          team: session.activeTeam as Team,
          teams: session.teams as Team[],
          isAuthenticated: true,
        });
      } else {
        set({
          user: null,
          organization: null,
          organizations: [],
          team: null,
          teams: [],
          isAuthenticated: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message });
      console.error("Error initializing auth state:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Login
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await signIn(email, password);
      // Re-initialize after login to get the session data
      await get().initialize();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut();
      set({
        user: null,
        organization: null,
        organizations: [],
        team: null,
        teams: [],
        isAuthenticated: false,
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Switch organization
  setOrganization: async (organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await switchOrganization(organizationId);
      // Organization switching reloads the page in the auth service
      // No need to update state as the page will refresh
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Set active team
  setTeam: (teamId: string) => {
    const teams = get().teams;
    const team = teams.find((t) => t.id === teamId) || null;
    set({ team });
    // Store team selection in local storage to persist across page reloads
    if (team) {
      localStorage.setItem("activeTeamId", team.id);
    } else {
      localStorage.removeItem("activeTeamId");
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
