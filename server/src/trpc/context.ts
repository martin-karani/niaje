import { AuthInstance } from "@/auth/configs/auth.config";
import { db } from "@/db";
import { Permission } from "@/permissions/models";
import { permissionService } from "@/permissions/services/permissions.service";
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
    // Add permission methods
    permissions: {
      hasPermission: async (permission: Permission): Promise<boolean> => {
        if (!session?.user) return false;
        return permissionService.hasPermission(
          session.user.id,
          session.user.role,
          permission
        );
      },
      hasPropertyPermission: async (
        propertyId: string,
        permission: Permission
      ): Promise<boolean> => {
        if (!session?.user) return false;
        return permissionService.hasPropertyPermission(
          session.user.id,
          session.user.role,
          propertyId,
          permission
        );
      },
      getUserPermissions: async () => {
        if (!session?.user)
          return { systemPermissions: [], propertyPermissions: [] };
        return permissionService.getUserPermissions(
          session.user.id,
          session.user.role
        );
      },
    },
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
