import { notifications } from "@mantine/notifications";
import { create } from "zustand";
import { CREATE_ORGANIZATION } from "../graphql/organization";
import { apolloClient } from "../services/api";
import {
  getSession,
  getUserOrganizations,
  signIn,
  signOut,
  switchOrganization,
} from "../services/auth";

// User type
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified?: boolean;
}

// Organization type
interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
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

  // New actions for organization selection
  fetchOrganizations: () => Promise<Organization[]>;

  // New action for organization creation
  createOrganization: (data: {
    name: string;
    slug?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    logo?: string;
    address?: string;
  }) => Promise<Organization>;
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

  // Fetch organizations for the current user
  fetchOrganizations: async () => {
    try {
      const organizations = await getUserOrganizations();
      set({ organizations });
      return organizations;
    } catch (error: any) {
      set({ error: error.message });
      console.error("Error fetching organizations:", error);
      return [];
    }
  },

  // Create a new organization
  createOrganization: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apolloClient.mutate({
        mutation: CREATE_ORGANIZATION,
        variables: { data },
      });

      const result = response.data.createOrganization;

      if (!result.success) {
        throw new Error(result.message || "Failed to create organization");
      }

      const newOrganization = result.organization;

      // Update the organizations list
      set((state) => ({
        organizations: [...state.organizations, newOrganization],
        isLoading: false,
      }));

      // Set this as the active organization
      await get().setOrganization(newOrganization.id);

      notifications.show({
        title: "Success",
        message: `${newOrganization.name} has been created successfully!`,
        color: "green",
      });

      return newOrganization;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });

      notifications.show({
        title: "Error",
        message: error.message || "Failed to create organization",
        color: "red",
      });

      throw error;
    }
  },

  // Login
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await signIn(email, password);

      if (result.user) {
        set({
          user: result.user,
          organizations: result.organizations || [],
          organization: result.activeOrganization || null,
          team: result.activeTeam || null,
          isAuthenticated: true,
        });
      }
      return { success: true, redirectTo: "/organizations" };
    } catch (error: any) {
      // Handle specific authentication errors
      if (error.includes && error.includes("verify your email")) {
        set({
          error:
            "Please verify your email before logging in. Check your inbox for a verification link.",
        });
      } else if (
        error.includes &&
        error.includes("Invalid email or password")
      ) {
        set({ error: "Invalid email or password. Please try again." });
      } else {
        set({ error: error.message || "Login failed" });
      }
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
      const organization = await switchOrganization(organizationId);

      if (organization) {
        set({
          organization,
          team: null, // Reset team when changing organization
          isLoading: false,
        });
        return;
      }

      throw new Error("Failed to switch organization");
    } catch (error: any) {
      set({ error: error.message });
      throw error;
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
