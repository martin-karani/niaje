import { signIn, signOut, signUp, useSession } from "@/auth/auth-client";
import { trpc } from "@/utils/trpc";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "landlord" | "caretaker" | "agent" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  image?: string | null;
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
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionLoading } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user profile if there's a session
  const { data: userProfile, isLoading: isProfileLoading } =
    trpc.users.getProfile.useQuery(undefined, {
      enabled: !!session?.user,
      retry: 1,
      onError: () => {
        setUser(null);
        setIsLoading(false);
      },
    });

  // Fetch user permissions
  const { data: permissions } = trpc.permissions.getUserPermissions.useQuery(
    undefined,
    {
      enabled: !!session?.user,
      retry: 1,
    }
  );

  useEffect(() => {
    if (isSessionLoading || isProfileLoading) {
      setIsLoading(true);
      return;
    }

    if (session?.user && userProfile) {
      setUser({
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role.toLowerCase() as UserRole,
        isActive: userProfile.isActive,
        image: userProfile.image,
      });
    } else if (session?.user) {
      // Fallback to session data if profile fetch fails
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "",
        role: (session.user.role as UserRole) || "agent",
        isActive: true,
      });
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, [session, isSessionLoading, userProfile, isProfileLoading]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await signIn.email({ email, password });

      // No need to manually set user as the session change will trigger useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    try {
      setError(null);
      setIsLoading(true);
      await signUp.email({ email, password, name, role });
      await signIn.email({ email, password });

      // No need to manually set user as the session change will trigger useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !permissions) return false;

    // Admin has all permissions
    if (user.role === "admin") return true;

    // Check system permissions
    if (permissions.systemPermissions.includes(permission)) return true;

    // Check property permissions (simplified check)
    for (const propPerm of permissions.propertyPermissions) {
      if (propPerm.permissions.includes(permission)) return true;
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || isSessionLoading || isProfileLoading,
        error,
        login,
        register,
        logout,
        hasPermission,
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
