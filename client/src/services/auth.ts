import { createAuthClient } from "better-auth/client";
import {
  adminClient,
  emailOTPClient,
  organizationClient,
  phoneNumberClient,
} from "better-auth/client/plugins";
import { BetterAuthOptions } from "better-auth/types";

// Define available roles to match server configuration
export const availableRoles = [
  "admin", // System administrator
  "agent_owner", // Property management company owner
  "agent_staff", // Property management staff
  "property_owner", // Individual property owner
  "caretaker", // Property caretaker
  "tenant_user", // Tenant portal user
];

// Configure better-auth client
const authOptions: BetterAuthOptions = {
  appName: "Property Management System", // Match server appName
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  basePath: "/api/auth",

  plugins: [
    adminClient(),
    organizationClient({
      // roles: availableRoles,
      teams: {
        enabled: true, // Enable teams to match server configuration
      },
    }),
    phoneNumberClient(),
    emailOTPClient(),
  ],

  // Set client-side session settings to match server
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
};

// Initialize better-auth client
export const authClient = createAuthClient(authOptions);

// Get current session
export const getSession = async () => {
  try {
    return await authClient.getSession();
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

// Get auth token (for Apollo)
export const getToken = async () => {
  const session = await getSession();
  return session?.accessToken || null;
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const result = await authClient.signIn({
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

// Sign up new user
export const signUp = async (userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  try {
    const result = await authClient.signUp({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || "agent_staff",
      additionalFields: {
        isActive: true,
        emailVerified: false,
      },
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await authClient.signOut();
    window.location.href = "/auth/sign-in"; // Changed from signin to sign-in
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Request password reset
export const requestPasswordReset = async (email: string) => {
  try {
    const { data, error } = await authClient.forgetPassword({
      email,
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error);
    }

    return data;
  } catch (error) {
    console.error("Password reset request error:", error);
    throw error;
  }
};

// Reset password with token
export const resetPassword = async (token: string, password: string) => {
  try {
    const result = await authClient.resetPassword({
      token,
      password,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

// Switch active organization
export const switchOrganization = async (organizationId: string) => {
  try {
    await authClient.switchOrganization(organizationId);
    // Refresh the page to update context
    window.location.reload();
  } catch (error) {
    console.error("Switch organization error:", error);
    throw error;
  }
};

// Switch active team
export const switchTeam = async (teamId: string) => {
  try {
    await authClient.switchTeam(teamId);
    // Don't reload page to allow for smoother UX
    return true;
  } catch (error) {
    console.error("Switch team error:", error);
    throw error;
  }
};

// Accept organization invitation
export const acceptInvitation = async (token: string) => {
  try {
    const result = await authClient.acceptInvitation({
      token,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Accept invitation error:", error);
    throw error;
  }
};

// Create organization
export const createOrganization = async (orgData: {
  name: string;
  slug?: string;
}) => {
  try {
    const result = await authClient.createOrganization({
      name: orgData.name,
      slug: orgData.slug || undefined,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Create organization error:", error);
    throw error;
  }
};

// Invite user to organization
export const inviteToOrganization = async (inviteData: {
  email: string;
  role: string;
  teamId?: string;
}) => {
  try {
    const result = await authClient.inviteToOrganization({
      email: inviteData.email,
      role: inviteData.role,
      teamId: inviteData.teamId,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Invite to organization error:", error);
    throw error;
  }
};

// Create team
export const createTeam = async (teamData: {
  name: string;
  description?: string;
}) => {
  try {
    const result = await authClient.createTeam({
      name: teamData.name,
      description: teamData.description,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Create team error:", error);
    throw error;
  }
};

export default authClient;
