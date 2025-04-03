import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth-guard'; // Assuming you have this guard setup
import { CurrentUser } from './decorators/current-user.decorator'; // Assuming decorator exists
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Example custom endpoint: Get simplified session status
  // This complements better-auth's own /session endpoint
  @Get('status')
  @UseGuards(AuthGuard) // Protect the route
  async getAuthStatus(@CurrentUser() user: User | null) {
    if (user) {
      // Return minimal user info if logged in
      return { isAuthenticated: true, userId: user.id, role: user.role };
    } else {
      // Should not happen if AuthGuard is effective, but as fallback
      return { isAuthenticated: false };
    }
  }

  // Example: Endpoint to manually trigger profile fetch (if needed separate from /users/me)
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: User) {
    // Delegate to AuthService or UsersService
    return this.authService.getUserProfile(user.id);
  }

  // NOTE: Standard endpoints like /signin/email, /signup/email, /signout, /session
  // are handled by the BetterAuthMiddleware and should NOT be redefined here.
}
