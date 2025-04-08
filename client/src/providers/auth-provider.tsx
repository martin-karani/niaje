import { signIn, signOut, signUp, useSession } from "@/auth/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "landlord" | "caretaker" | "agent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isLoading } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update user when session changes
  useEffect(() => {
    if (session && session.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "",
        role: (session.user.role as UserRole) || "agent",
      });
    } else {
      setUser(null);
    }
  }, [session]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signIn.email({ email, password });
      // Session will be updated automatically by useSession hook
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
      throw err;
    }
  };

  // Register function
  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    try {
      setError(null);
      await signUp.email({ email, password, name, role });
      // After registration, log the user in
      await signIn.email({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      await signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
