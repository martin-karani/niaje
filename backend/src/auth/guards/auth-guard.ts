import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { toNodeHandler } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_INSTANCE') private readonly auth: any,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      // Get session from Better Auth
      const session = await this.auth.api.getSession({
        headers: toNodeHandler(request.headers),
      });

      // If no session, throw unauthorized exception
      if (!session) {
        throw new UnauthorizedException('Authentication required');
      }

      // Check for required roles
      const requiredRoles = this.reflector.get<UserRole[]>(
        'roles',
        context.getHandler(),
      );

      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.includes(session.user.role as UserRole);

        if (!hasRole) {
          throw new UnauthorizedException(
            'You do not have permission to access this resource',
          );
        }
      }

      // Attach session and user to request for later use
      request.session = session;
      request.user = session.user;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
