// src/middleware/auth.middleware.ts
import { AuthInstance } from "@/auth/configs/auth.config";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";

/**
 * Middleware to extract user session and active organization
 */
export function createBetterAuthMiddleware(auth: AuthInstance) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get session from auth headers
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      // Attach the session to the request
      (req as any).session = session;
      (req as any).user = session?.user || null;

      // If there's an active organization, attach it too
      if (session?.activeOrganizationId) {
        const activeOrg = await db.query.organization.findFirst({
          where: eq(organization.id, session.activeOrganizationId),
        });

        if (activeOrg) {
          (req as any).activeOrganization = activeOrg;
        }
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(); // Continue to next middleware even on error
    }
  };
}
