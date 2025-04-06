"use client";

import { useAuth } from "@/providers/auth-provider";

type Role = "landlord" | "caretaker" | "agent" | "admin";

/**
 * Hook for Role-Based Access Control
 * Uses the authenticated user's role to determine access permissions
 */
export function useRBAC() {
  const { user } = useAuth();

  const userRole = user?.role?.toLowerCase() as Role | undefined;

  // Check if user has a specific role
  const hasRole = (role: Role): boolean => {
    if (!userRole) return false;
    return userRole === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: Role[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole as Role);
  };

  // Role hierarchy - users can access all resources of roles below them
  const canAccess = (requiredRole: Role): boolean => {
    if (!userRole) return false;

    const roleHierarchy: Record<Role, number> = {
      admin: 4,
      landlord: 3,
      caretaker: 2,
      agent: 1,
    };

    const userRoleWeight = roleHierarchy[userRole as Role] || 0;
    const requiredRoleWeight = roleHierarchy[requiredRole] || 0;

    return userRoleWeight >= requiredRoleWeight;
  };

  return {
    userRole,
    hasRole,
    hasAnyRole,
    canAccess,
    isLandlord: userRole === "landlord",
    isCaretaker: userRole === "caretaker",
    isAgent: userRole === "agent",
    isAdmin: userRole === "admin",
  };
}
