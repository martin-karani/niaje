// src/auth/components/PermissionGuard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";

type PermissionGuardProps = {
  permissions: Record<string, string[]>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Component that conditionally renders children based on the user's permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  fallback = null,
  children,
}) => {
  const { hasPermission } = useAuth();
  const [canAccess, setCanAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPermission = async () => {
      setLoading(true);
      const result = await hasPermission(permissions);
      setCanAccess(result);
      setLoading(false);
    };

    checkPermission();
  }, [permissions, hasPermission]);

  if (loading) {
    return null; // Or a loading indicator
  }

  return canAccess ? <>{children}</> : <>{fallback}</>;
};

// src/auth/components/RolePermissionGuard.tsx

type RolePermissionGuardProps = {
  permissions: Record<string, string[]>;
  role: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Component that conditionally renders children based on role permissions
 * without making a server request (client-side check only)
 */
export const RolePermissionGuard: React.FC<RolePermissionGuardProps> = ({
  permissions,
  role,
  fallback = null,
  children,
}) => {
  const { checkRolePermission } = useAuth();
  const canAccess = checkRolePermission(permissions, role);

  return canAccess ? <>{children}</> : <>{fallback}</>;
};

// src/auth/components/TeamMemberGuard.tsx

type TeamMemberGuardProps = {
  teamId: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Component that conditionally renders children based on whether
 * the current user is a member of the specified team
 */
export const TeamMemberGuard: React.FC<TeamMemberGuardProps> = ({
  teamId,
  fallback = null,
  children,
}) => {
  const { teams } = useAuth();
  const isTeamMember = teams.some((team) => team.id === teamId);

  return isTeamMember ? <>{children}</> : <>{fallback}</>;
};

// src/auth/components/OrganizationGuard.tsx

type OrganizationGuardProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Component that conditionally renders children if the user
 * has an active organization
 */
export const OrganizationGuard: React.FC<OrganizationGuardProps> = ({
  fallback = null,
  children,
}) => {
  const { activeOrganization } = useAuth();

  return activeOrganization ? <>{children}</> : <>{fallback}</>;
};

// Export all components
export {
  OrganizationGuard,
  PermissionGuard,
  RolePermissionGuard,
  TeamMemberGuard,
};
