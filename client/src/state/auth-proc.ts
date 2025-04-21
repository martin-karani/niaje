// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import authClient from "./auth-client";

// Define types for the auth context
type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  [key: string]: any;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, any>;
};

type Member = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  teamId?: string;
};

type Team = {
  id: string;
  name: string;
  organizationId: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  activeOrganization: Organization | null;
  organizations: Organization[];
  activeMember: Member | null;
  teams: Team[];
  activeTeam: Team | null;

  // Authentication methods
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;

  // Organization methods
  createOrganization: (
    name: string,
    slug: string,
    logo?: string
  ) => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  deleteOrganization: (organizationId?: string) => Promise<void>;
  setActiveOrganization: (organizationId: string) => Promise<void>;

  // Team methods
  createTeam: (name: string, organizationId?: string) => Promise<void>;
  updateTeam: (teamId: string, data: { name: string }) => Promise<void>;
  removeTeam: (teamId: string) => Promise<void>;
  setActiveTeam: (teamId: string | null) => Promise<void>;

  // Member methods
  inviteMember: (email: string, role: string, teamId?: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  removeMember: (memberIdOrEmail: string) => Promise<void>;

  // Permission methods
  hasPermission: (permissions: Record<string, string[]>) => Promise<boolean>;
  checkRolePermission: (
    permissions: Record<string, string[]>,
    role: string
  ) => boolean;

  // Refetch data
  refetchUserData: () => Promise<void>;
  refetchOrganizationData: () => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);

        // Get current session
        const session = await authClient.getSession();

        if (session) {
          setIsAuthenticated(true);
          setUser(session.user);

          // Fetch organizations
          await refetchOrganizationData();
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setActiveOrganization(null);
          setOrganizations([]);
          setActiveMember(null);
          setTeams([]);
          setActiveTeam(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Authentication methods
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      await authClient.signUp({ email, password, name });

      // After sign up, get the session (auto sign-in if enabled)
      const session = await authClient.getSession();

      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await authClient.signIn({ email, password });

      const session = await authClient.getSession();

      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);

        // Fetch organizations
        await refetchOrganizationData();
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();

      setIsAuthenticated(false);
      setUser(null);
      setActiveOrganization(null);
      setOrganizations([]);
      setActiveMember(null);
      setTeams([]);
      setActiveTeam(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      await authClient.resetPassword({ email });
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await authClient.changePassword({ oldPassword, newPassword });
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Organization methods
  const createOrganization = async (
    name: string,
    slug: string,
    logo?: string
  ) => {
    try {
      setIsLoading(true);
      await authClient.organization.create({
        name,
        slug,
        logo,
      });

      // Refresh organizations
      await refetchOrganizationData();
    } catch (error) {
      console.error("Create organization error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrganization = async (data: Partial<Organization>) => {
    try {
      setIsLoading(true);
      await authClient.organization.update({
        data,
        organizationId: data.id || activeOrganization?.id || "",
      });

      // Refresh organizations
      await refetchOrganizationData();
    } catch (error) {
      console.error("Update organization error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrganization = async (organizationId?: string) => {
    try {
      setIsLoading(true);
      await authClient.organization.delete({
        organizationId: organizationId || activeOrganization?.id || "",
      });

      // Refresh organizations
      await refetchOrganizationData();
    } catch (error) {
      console.error("Delete organization error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveOrg = async (organizationId: string) => {
    try {
      setIsLoading(true);
      await authClient.organization.setActive({
        organizationId,
      });

      // Refresh organization data
      await refetchOrganizationData();
    } catch (error) {
      console.error("Set active organization error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Team methods
  const createTeam = async (name: string, organizationId?: string) => {
    try {
      setIsLoading(true);
      await authClient.organization.createTeam({
        name,
        organizationId: organizationId || activeOrganization?.id || "",
      });

      // Refresh teams
      await fetchTeams();
    } catch (error) {
      console.error("Create team error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeam = async (teamId: string, data: { name: string }) => {
    try {
      setIsLoading(true);
      await authClient.organization.updateTeam({
        teamId,
        data,
      });

      // Refresh teams
      await fetchTeams();
    } catch (error) {
      console.error("Update team error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTeam = async (teamId: string) => {
    try {
      setIsLoading(true);
      await authClient.organization.removeTeam({
        teamId,
      });

      // Refresh teams
      await fetchTeams();

      // If active team was removed, set active team to null
      if (activeTeam && activeTeam.id === teamId) {
        setActiveTeam(null);
      }
    } catch (error) {
      console.error("Remove team error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveTeamState = async (teamId: string | null) => {
    try {
      if (teamId === null) {
        setActiveTeam(null);
        return;
      }

      // Find the team in the teams array
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        setActiveTeam(team);
      }
    } catch (error) {
      console.error("Set active team error:", error);
      throw error;
    }
  };

  // Member methods
  const inviteMember = async (email: string, role: string, teamId?: string) => {
    try {
      setIsLoading(true);
      await authClient.organization.inviteMember({
        email,
        role,
        teamId,
      });
    } catch (error) {
      console.error("Invite member error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      setIsLoading(true);
      await authClient.organization.updateMemberRole({
        memberId,
        role,
      });
    } catch (error) {
      console.error("Update member role error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (memberIdOrEmail: string) => {
    try {
      setIsLoading(true);
      await authClient.organization.removeMember({
        memberIdOrEmail,
      });
    } catch (error) {
      console.error("Remove member error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Permission methods
  const hasPermission = async (permissions: Record<string, string[]>) => {
    try {
      return await authClient.organization.hasPermission({
        permissions,
      });
    } catch (error) {
      console.error("Has permission error:", error);
      return false;
    }
  };

  const checkRolePermission = (
    permissions: Record<string, string[]>,
    role: string
  ) => {
    try {
      return authClient.organization.checkRolePermission({
        permissions,
        role,
      });
    } catch (error) {
      console.error("Check role permission error:", error);
      return false;
    }
  };

  // Helper methods to fetch data
  const fetchTeams = async () => {
    if (!activeOrganization) return;

    try {
      const teamData = await authClient.organization.listTeams({
        query: {
          organizationId: activeOrganization.id,
        },
      });

      setTeams(teamData);
    } catch (error) {
      console.error("Fetch teams error:", error);
    }
  };

  const refetchUserData = async () => {
    try {
      const session = await authClient.getSession();

      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Refetch user data error:", error);
    }
  };

  const refetchOrganizationData = async () => {
    try {
      // Get list of organizations
      const { data: organizationList } = authClient.useListOrganizations();
      setOrganizations(organizationList || []);

      // Get active organization
      const { data: activeOrg } = authClient.useActiveOrganization();
      setActiveOrganization(activeOrg || null);

      if (activeOrg) {
        // Get active member
        const activeMemberData =
          await authClient.organization.getActiveMember();
        setActiveMember(activeMemberData || null);

        // Fetch teams for active organization
        await fetchTeams();
      } else {
        setActiveMember(null);
        setTeams([]);
        setActiveTeam(null);
      }
    } catch (error) {
      console.error("Refetch organization data error:", error);
    }
  };

  // Provide auth context
  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    activeOrganization,
    organizations,
    activeMember,
    teams,
    activeTeam,

    signUp,
    signIn,
    signOut,
    resetPassword,
    changePassword,

    createOrganization,
    updateOrganization,
    deleteOrganization,
    setActiveOrganization: setActiveOrg,

    createTeam,
    updateTeam,
    removeTeam,
    setActiveTeam: setActiveTeamState,

    inviteMember,
    updateMemberRole,
    removeMember,

    hasPermission,
    checkRolePermission,

    refetchUserData,
    refetchOrganizationData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
