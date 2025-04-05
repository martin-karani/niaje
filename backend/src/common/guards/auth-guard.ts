import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from 'src/lib/auth';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator';

@Injectable()
export class BetterGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest<Request>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic || req.url.startsWith('/api/auth')) {
      console.log('Public route or auth route, skipping guard');
      return true;
    }

    let session;
    try {
      // 2. Get the user session
      session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers as any),
      });
    } catch (error) {
      // Handle potential errors during session retrieval (e.g., invalid token)
      throw new UnauthorizedException('Invalid or expired session');
    }

    // 3. Check if a valid session and user exist
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // 4. Get required roles from the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 5. If no roles are required, allow access (just needed authentication)
    if (!requiredRoles || requiredRoles.length === 0) {
      // Add user to request object for easier access in controllers if needed
      // (Ensure you have a corresponding @CurrentUser decorator setup)
      (req as any).user = session.user;
      return true;
    }

    // 6. Check if the user has one of the required roles
    const userRole = session.user.role as UserRole; // Cast user role
    const hasRequiredRole = requiredRoles.some((role) => role === userRole);

    if (hasRequiredRole) {
      // Add user to request object
      (req as any).user = session.user;
      return true;
    }

    // 7. If user does not have the required role, deny access
    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }
}
