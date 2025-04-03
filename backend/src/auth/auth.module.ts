import { Module, NestModule, MiddlewareConsumer, Global } from '@nestjs/common'; // Keep Global for now if PrismaModule relies on it
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BetterAuthMiddleware } from './middleware/better-auth.middleware';
import { PrismaAuthAdapter } from './config/prisma-adapter';
import { createAuthInstance } from './config/better-auth-config';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule

@Global() // Keep Global since PrismaModule is Global and this module provides AUTH_INSTANCE globally
@Module({
  imports: [PrismaModule], // Add PrismaModule here
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaAuthAdapter, // Needs PrismaService from PrismaModule
    {
      provide: 'AUTH_INSTANCE',
      useFactory: (prismaAuthAdapter: PrismaAuthAdapter) => {
        // This now correctly receives the adapter instance
        const auth = createAuthInstance(prismaAuthAdapter);
        return auth;
      },
      inject: [PrismaAuthAdapter], // Inject the adapter instance
    },
  ],
  // Exports are needed for the @Global decorator to work effectively
  exports: [AuthService, 'AUTH_INSTANCE', PrismaAuthAdapter],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Better Auth middleware ONLY to the /api/auth path
    consumer.apply(BetterAuthMiddleware).forRoutes('/api/auth'); // Correct path
  }
}
