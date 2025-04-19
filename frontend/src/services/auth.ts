import { createAuthClient } from "better-auth/client";
import {
  adminClient,
  emailOTPClient,
  organizationClient,
  phoneNumberClient,
} from "better-auth/client/plugins";
import { BetterAuthOptions } from "better-auth/types";

// Configure better-auth client
const authOptions: BetterAuthOptions = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  basePath: "/api/auth",

  plugins: [
    adminClient(),
    organizationClient(),
    phoneNumberClient(),
    emailOTPClient(),
  ],
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
    window.location.href = "/auth/signin";
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

export default authClient;
