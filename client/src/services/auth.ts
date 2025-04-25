import {
  GET_CURRENT_USER,
  GET_MY_ORGANIZATIONS,
  LOGIN,
  LOGOUT,
  REGISTER,
  REQUEST_PASSWORD_RESET,
  RESEND_VERIFICATION_EMAIL,
  RESET_PASSWORD,
  SWITCH_ORGANIZATION,
  VERIFY_EMAIL,
} from "../graphql/auth";
import { apolloClient } from "./api";

// Define available roles to match server configuration
export const availableRoles = [
  "admin", // System administrator
  "agent_owner", // Property management company owner
  "agent_staff", // Property management staff
  "property_owner", // Individual property owner
  "caretaker", // Property caretaker
  "tenant_user", // Tenant portal user
];

// Get current session
export const getSession = async () => {
  try {
    const { data } = await apolloClient.query({
      query: GET_CURRENT_USER,
      fetchPolicy: "network-only",
    });

    if (data?.me) {
      return {
        user: data.me.user,
        activeOrganization: data.me.activeOrganization,
        organizations: data.me.organizations,
        activeTeam: data.me.activeTeam,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

// Get auth token (for Apollo)
export const getToken = async () => {
  // The token is now handled via cookies, so we don't need to return it
  // This is kept for API compatibility
  return null;
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: LOGIN,
      variables: {
        input: {
          email,
          password,
        },
      },
    });

    if (!data?.login) {
      throw new Error("Login failed");
    }

    return {
      user: data.login.user,
      organizations: data.login.organizations,
      activeOrganization: data.login.activeOrganization,
      activeTeam: data.login.activeTeam,
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error.message || "Authentication failed";
  }
};

// Sign up new user
export const signUp = async (userData: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: REGISTER,
      variables: {
        input: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          passwordConfirm: userData.password,
        },
      },
    });

    if (!data?.register) {
      throw new Error("Registration failed");
    }

    return data.register;
  } catch (error: any) {
    console.error("Sign up error:", error);
    throw error.message || "Registration failed";
  }
};

// Sign out
export const signOut = async () => {
  try {
    await apolloClient.mutate({
      mutation: LOGOUT,
    });

    // Clear Apollo Client cache
    await apolloClient.clearStore();

    // Redirect to login page
    window.location.href = "/auth/sign-in";
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Request password reset
export const requestPasswordReset = async (email: string) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: REQUEST_PASSWORD_RESET,
      variables: {
        input: {
          email,
        },
      },
    });

    return data.requestPasswordReset;
  } catch (error: any) {
    console.error("Password reset request error:", error);
    throw error.message || "Failed to request password reset";
  }
};

// Get user's organizations
export const getUserOrganizations = async () => {
  try {
    const { data } = await apolloClient.query({
      query: GET_MY_ORGANIZATIONS,
      fetchPolicy: "network-only",
    });

    return data.myOrganizations || [];
  } catch (error) {
    console.error("Get organizations error:", error);
    return [];
  }
};

// Switch active organization
export const switchOrganization = async (organizationId: string) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: SWITCH_ORGANIZATION,
      variables: {
        input: {
          organizationId,
        },
      },
    });

    if (data?.switchOrganization?.success) {
      // Refetch the session to update the active organization
      await apolloClient.resetStore();
      return data.switchOrganization.organization;
    }

    throw new Error(
      data?.switchOrganization?.message || "Failed to switch organization"
    );
  } catch (error: any) {
    console.error("Switch organization error:", error);
    throw error.message || "Failed to switch organization";
  }
};

export const resetPassword = async (token: string, password: string) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: RESET_PASSWORD,
      variables: {
        input: {
          token,
          password,
          confirmPassword: password,
        },
      },
    });

    return data.resetPassword;
  } catch (error: any) {
    console.error("Password reset error:", error);
    throw error.message || "Failed to reset password";
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: VERIFY_EMAIL,
      variables: {
        input: {
          token,
        },
      },
    });

    return data.verifyEmail;
  } catch (error: any) {
    console.error("Email verification error:", error);
    throw error.message || "Failed to verify email";
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email: string) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: RESEND_VERIFICATION_EMAIL,
      variables: {
        input: {
          email,
        },
      },
    });

    return data.resendVerificationEmail;
  } catch (error: any) {
    console.error("Resend verification email error:", error);
    throw error.message || "Failed to resend verification email";
  }
};

export default {
  getSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
  getUserOrganizations,
  switchOrganization,
  verifyEmail,
  resendVerificationEmail,
};
