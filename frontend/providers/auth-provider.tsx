"use client";

import { signIn, signOut, useSession } from "@/lib/auth-client";
import { signUpWithEmail } from "@/lib/better-auth-client";
import { User } from "better-auth/types";
import { useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";

type UserRole = "LANDLORD" | "CARETAKER" | "AGENT" | "ADMIN";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error: sessionError } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to sign in");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");
    }
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole = "LANDLORD"
    ) => {
      try {
        setError(null);
        setIsLoading(true);

        const result = await signUpWithEmail({
          name,
          email,
          password,
          role,
        });

        if (result.error) {
          setError(result.error.message || "Failed to create account");
          toast.error(result.error.message || "Failed to create account");
        } else {
          // Registration successful
          toast.success("Account created successfully");

          // Automatically log in after registration
          const loginResult = await signIn.email({
            email,
            password,
          });

          if (!loginResult.error) {
            // Redirect to dashboard after successful registration and login
            router.push("/dashboard");
          }
        }
      } catch (err: any) {
        setError(err.message || "An error occurred during registration");
        toast.error(err.message || "An error occurred during registration");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (err: any) {
      setError(err.message || "Failed to sign out");
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const errorMessage = error || (sessionError ? sessionError.message : null);

  // Extract the user from session
  const user = (session?.user as User) || null;
  const isAuthenticated = !!session?.user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        error: errorMessage,
        login,
        register,
        logout,
        clearError,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
