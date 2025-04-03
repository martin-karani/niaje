import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_INSTANCE') private readonly auth: any, // Consider typing 'auth' properly using your exported Auth type
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Get session from Better Auth using fromNodeHeaders
      const session = await this.auth.api.getSession({
        headers: fromNodeHeaders(request.headers), // Use fromNodeHeaders here
      });

      // If no session, throw unauthorized exception
      if (!session || !session.user) {
        throw new UnauthorizedException('Authentication required');
      }

      // Check for required roles
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        'roles',
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles && requiredRoles.length > 0) {
        // Make sure session.user.role exists and is correctly typed
        const userRole = session.user.role as UserRole;
        if (!userRole) {
          throw new UnauthorizedException('User role not found in session');
        }
        const hasRole = requiredRoles.includes(userRole);

        if (!hasRole) {
          throw new UnauthorizedException(
            'You do not have permission to access this resource',
          );
        }
      }

      // Attach session and user to request for later use
      // Ensure your request object interface includes these if using TypeScript strictly
      request.session = session;
      request.user = session.user;

      return true;
    } catch (error) {
      // Log the error for debugging if needed
      console.error('AuthGuard Error:', error);

      // Rethrow specific exceptions or a generic one
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Authentication failed or invalid session',
      );
    }
  }
}
