import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BetterAuthMiddleware } from './middleware/better-auth.middleware';
import { PrismaAuthAdapter } from './config/prisma-adapter';
import { createAuthInstance } from './config/better-auth-config';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaAuthAdapter,
    {
      provide: 'AUTH_INSTANCE',
      useFactory: (prismaAuthAdapter: PrismaAuthAdapter) => {
        const auth = createAuthInstance(prismaAuthAdapter);
        return auth;
      },
      inject: [PrismaAuthAdapter],
    },
  ],
  exports: [AuthService, 'AUTH_INSTANCE', PrismaAuthAdapter],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Better Auth middleware to all routes
    consumer.apply(BetterAuthMiddleware).forRoutes('*');
  }
}
