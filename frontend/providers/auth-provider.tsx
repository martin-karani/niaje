"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {signIn, signUp,  signOut, useSession } from "@/lib/auth-client";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error: sessionError, refetch } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await signIn.email({
        email: email,
        password: password,
        rememberMe: true,
        callbackURL: '/dashboard',
        
      });   
      
      if (error) {
        setError(error.message || "Failed to sign in");
        return;
      }
      
      // Refresh session data
      refetch();
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");
    }
  }, [refetch]);

  // Register function
  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { error } = await signUp.email({
        name: name,
        email: email,
        password: password,
        callbackURL: '/dashboard',
        image: 'https://example.com/image.jpg',
      });
      
      if (error) {
        setError(error.message || "Failed to create account");
        return;
      }
      
      // Refresh session data
      refetch();
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
    }
  }, [refetch]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await signOut();
      // Refresh session data
      refetch();
    } catch (err: any) {
      setError(err.message || "Failed to sign out");
    }
  }, [refetch]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const errorMessage = error || (sessionError ? sessionError.message : null);

  return (
    <AuthContext.Provider
      value={{
        user: session || null,
        isLoading: isPending,
        error: errorMessage,
        login,
        register,
        logout,
        clearError
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