import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { AuthInstance } from "./config";

export function createBetterAuthMiddleware(auth: AuthInstance) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if the route is an auth route (starting with /api/auth)
    if (req.path.startsWith("/api/auth")) {
      console.log(`Processing auth request: ${req.method} ${req.path}`);

      try {
        // Use Better Auth's API to handle the request
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });

        // Attach the session to the request for use in other middlewares/routes
        (req as any).session = session;
        (req as any).user = session?.user || null;

        // Continue processing the request
        next();
      } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ error: "Authentication error" });
      }
    } else {
      // For non-auth routes, just continue
      next();
    }
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = (req as any).user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}
