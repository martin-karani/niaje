import { Injectable, NestMiddleware, Logger, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { toNodeHandler } from 'better-auth/node';

@Injectable()
export class BetterAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BetterAuthMiddleware.name);

  constructor(@Inject('AUTH_INSTANCE') private readonly auth: any) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Check if the route is an auth route (starting with /api/auth)
    if (req.path.startsWith('/api/auth')) {
      this.logger.log(`Processing auth request: ${req.method} ${req.path}`);

      // Use Better Auth's handler for auth routes
      return toNodeHandler(this.auth)(req, res);
    }

    // For non-auth routes, continue to the next middleware
    next();
  }
}
