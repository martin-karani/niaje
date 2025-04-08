import { signIn, signOut, signUp, useSession } from "@/auth/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "landlord" | "caretaker" | "agent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthContext {
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

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isLoading } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signIn.email({ email, password });
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
      await signIn.email({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
      throw err;
    }
  };

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
