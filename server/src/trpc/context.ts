import { AuthInstance } from "@/auth/configs/auth.config";
import { db } from "@/db";
import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";

/**
 * Create context for tRPC requests
 */
export async function createContext(
  { req, res }: CreateExpressContextOptions,
  auth: AuthInstance
) {
  // Get user session from better-auth
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return {
    req,
    res,
    db,
    user: session?.user || null,
    auth,
    // Helper methods for permission checks
    isPropertyOwner: async (propertyId: string) => {
      if (!session?.user) return false;

      const property = await db.query.properties.findFirst({
        where: (properties, { and, eq }) =>
          and(
            eq(properties.id, propertyId),
            eq(properties.ownerId, session.user.id)
          ),
      });

      return Boolean(property);
    },
    hasPropertyPermission: async (
      propertyId: string,
      permissionType?: string
    ) => {
      if (!session?.user) return false;

      // Admin always has all permissions
      if (session.user.role === "ADMIN") return true;

      // Owner has all permissions to their properties
      const isOwner = await db.query.properties.findFirst({
        where: (properties, { and, eq }) =>
          and(
            eq(properties.id, propertyId),
            eq(properties.ownerId, session.user.id)
          ),
      });

      if (isOwner) return true;

      // Otherwise check specific permission
      if (permissionType) {
        const permissionField = getPermissionFieldName(permissionType);
        if (!permissionField) return false;

        const permission = await db.query.userPermissions.findFirst({
          where: (permissions, { and, eq }) =>
            and(
              eq(permissions.userId, session.user.id),
              eq(permissions.propertyId, propertyId)
            ),
        });

        return permission && permission[permissionField] === true;
      }

      // Check if user has any permission for this property
      const permission = await db.query.userPermissions.findFirst({
        where: (permissions, { and, eq }) =>
          and(
            eq(permissions.userId, session.user.id),
            eq(permissions.propertyId, propertyId)
          ),
      });

      return Boolean(permission);
    },
  };
}

/**
 * Helper to map permission types to database field names
 */
function getPermissionFieldName(permissionType: string): string | null {
  const permissionMap: Record<string, string> = {
    manageTenants: "canManageTenants",
    manageLeases: "canManageLeases",
    collectPayments: "canCollectPayments",
    viewFinancials: "canViewFinancials",
    manageMaintenance: "canManageMaintenance",
    manageProperties: "canManageProperties",
  };

  return permissionMap[permissionType] || null;
}

export type Context = inferAsyncReturnType<typeof createContext>;
