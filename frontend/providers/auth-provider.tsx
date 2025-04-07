"use client";

import { getUserSession, signUpWithEmail } from "@/lib/api-client";
import { getSession, signIn, signOut } from "@/lib/auth-client";
import { UserRole } from "@/types/user";
import { User } from "@/utils/trpc-type";
import React, { createContext, useCallback, useContext, useState } from "react";

// Define response types for authentication operations
export interface AuthResult {
  success: boolean;
  error?: {
    message: string;
    code?: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean; // Represents initial loading state
  isAuthenticating: boolean; // Represents loading during login/register
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole
  ) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  clearError: () => void;
}

const AUTH_USER_STORAGE_KEY = "authUser";

const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticating: false,
  error: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => ({ success: false }),
  clearError: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State for auth
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Tracks initial load/check
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Tracks login/signup process
  const [error, setError] = useState<string | null>(null);

  // // Fetch user data or load from storage on initial mount
  // useEffect(() => {
  //   const initializeAuth = async () => {
  //     await refreshUser();
  //   };

  //   initializeAuth();
  // }, []);

  // const refreshUser = async () => {
  //   try {
  //     const { data, error: refreshError } = await getUserSession();
  //     if (refreshError) {
  //       console.error("Error refreshing user:", refreshError);
  //       // If refresh fails, do not clear current user
  //     } else if (data?.user) {
  //       setUser(data.user);
  //       localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
  //     } else {
  //       // Session expired or user logged out
  //       setUser(null);
  //       localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  //     }
  //   } catch (err) {
  //     console.error("Failed to refresh user:", err);
  //     // On network error, keep current user state
  //   }
  // };

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setError(null);
      setIsAuthenticating(true);

      try {
        await signIn.email({
          email,
          password,
        });

        const { data } = await getSession();
        const userData: any = data?.user;
        setUser(userData);
        console.log("User data:", userData);
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userData));
        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "An error occurred during sign in";
        setError(errorMessage);
        return {
          success: false,
          error: {
            message: errorMessage,
            code: err.code || "UNKNOWN_ERROR",
          },
        };
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole = "LANDLORD"
    ): Promise<AuthResult> => {
      if (isAuthenticating) {
        return {
          success: false,
          error: { message: "Authentication already in progress" },
        };
      }

      setError(null);
      setIsAuthenticating(true);

      try {
        const { data, error: signUpError } = await signUpWithEmail({
          name,
          email,
          password,
          role,
        });

        if (signUpError) {
          setError(signUpError.message || "Failed to create account");
          return {
            success: false,
            error: {
              message: signUpError.message || "Failed to create account",
              code: signUpError.code,
            },
          };
        }

        // Add a small delay before getting the session
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Try to get the session after signup
        const { data: sessionData, error: sessionError } =
          await getUserSession();

        if (sessionError) {
          setError("Account created but couldn't sign in automatically.");
          return {
            success: true, // Account was created
            error: {
              message:
                "Account created but couldn't sign in automatically. Please sign in manually.",
              code: sessionError.code,
            },
          };
        }

        // Set user if session was retrieved successfully
        if (sessionData?.user) {
          setUser(sessionData.user);
          localStorage.setItem(
            AUTH_USER_STORAGE_KEY,
            JSON.stringify(sessionData.user)
          );
        }

        return { success: true };
      } catch (err: any) {
        const errorMessage =
          err.message || "An error occurred during registration";
        setError(errorMessage);
        return {
          success: false,
          error: {
            message: errorMessage,
            code: err.code || "UNKNOWN_ERROR",
          },
        };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [isAuthenticating]
  );

  const logout = useCallback(async (): Promise<AuthResult> => {
    setError(null);
    try {
      await signOut();
      setUser(null);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      // Don't navigate here - let the component handle navigation
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to sign out";
      setError(errorMessage);
      return {
        success: false,
        error: {
          message: errorMessage,
          code: err.code || "LOGOUT_ERROR",
        },
      };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticating,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth hook remains the same
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
