import { signIn, signOut, signUp, useSession } from "@/auth/auth-client";
import { trpc } from "@/utils/trpc";
import { Building } from "lucide-react";
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

// Define a Property interface
export interface Property {
  id: string;
  name: string;
  logo?: React.ElementType;
  plan?: string;
  address?: string;
  units?: any[]; // This could be more specific in a real app
  stats?: {
    totalResidents?: number;
    occupancyRate?: number;
    upcomingPercentage?: number;
  };
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

  // New property management features
  properties: Property[] | null;
  activeProperty: Property | null;
  setActiveProperty: (property: Property) => void;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionLoading } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New state for properties
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);

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

  // Fetch properties for the authenticated user
  const { data: propertiesData, isLoading: isPropertiesLoading } =
    trpc.properties.getAll.useQuery(undefined, {
      enabled: !!session?.user,
      retry: 1,
    });

  // Set user when data is loaded
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

  // Set properties and active property when properties data is loaded
  useEffect(() => {
    if (propertiesData) {
      // Format properties and add defaults
      const formattedProperties = propertiesData.map((property) => ({
        ...property,
        logo: property.logo || Building, // Default to Building icon
        plan: property.plan || "Standard", // Default plan
      }));

      setProperties(formattedProperties);

      // Set first property as active if none is selected and there are properties
      if (formattedProperties.length > 0 && !activeProperty) {
        setActiveProperty(formattedProperties[0]);
      }
    }
  }, [propertiesData, activeProperty]);

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
      // Clear property state on logout
      setProperties(null);
      setActiveProperty(null);
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

  // Handle property change
  const handleSetActiveProperty = (property: Property) => {
    setActiveProperty(property);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading:
          isLoading ||
          isSessionLoading ||
          isProfileLoading ||
          isPropertiesLoading,
        error,
        login,
        register,
        logout,
        hasPermission,
        properties,
        activeProperty,
        setActiveProperty: handleSetActiveProperty,
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
