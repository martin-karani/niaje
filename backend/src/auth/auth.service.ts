import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
// Remove PrismaAuthAdapter dependency if not directly needed here

@Injectable()
export class AuthService {
  constructor(
    // Inject the configured better-auth instance
    @Inject('AUTH_INSTANCE') private auth: any, // Consider defining a type for the auth instance
    private prisma: PrismaService,
  ) {}

  async signOutSession(sessionToken: string): Promise<void> {
    try {
      await this.auth.api.signOut({ sessionToken });
    } catch (error) {
      console.error('Error signing out session:', error);
    }
  }

  // Example: Get current session info (useful for backend checks)
  // Note: AuthGuard already does this for route protection
  async getSessionFromHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Promise<any | null> {
    try {
      // Use the helper provided by better-auth
      const { fromNodeHeaders } = await import('better-auth/node');
      const session = await this.auth.api.getSession({
        headers: fromNodeHeaders(headers),
      });
      return session;
    } catch (error) {
      // console.error("Failed to get session from headers:", error);
      return null; // Return null if no session or error
    }
  }

  // --- Profile Management Methods (can stay here or move to UsersService) ---

  // Get user profile data by ID (excluding sensitive info)
  async getUserProfile(id: string): Promise<Partial<User> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        // Select only the fields needed for a profile view
        id: true,
        email: true, // May want to hide email depending on context
        name: true,
        role: true,
        phone: true,
        image: true, // Use 'image' field from updated schema
        address: true,
        city: true,
        country: true,
        bio: true,
        createdAt: true,
        // Exclude isActive, emailVerified unless needed for profile display
      },
    });

    if (!user) {
      return null;
    }

    // Add role-specific counts if needed, similar to previous version
    // ...

    return user;
  }

  // Update user profile (non-sensitive fields)
  async updateUserProfile(
    id: string,
    data: Partial<User>,
  ): Promise<Partial<User> | null> {
    // Ensure sensitive fields are not updated through this method
    const { password, role, isActive, emailVerified, email, ...updateData } =
      data;

    // Rename profileImage to image if schema was updated
    if ('profileImage' in updateData && updateData.profileImage !== undefined) {
      updateData.image = updateData.profileImage;
      delete updateData.profileImage;
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          // Return updated profile fields
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          image: true,
          address: true,
          city: true,
          country: true,
          bio: true,
          createdAt: true,
        },
      });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Handle specific errors like Prisma record not found
      return null;
    }
  }

  // --- Removed Methods ---
  // validateSession: Handled by AuthGuard
  // getAuthInstance: Can be kept or removed
  // validateUser, createUser, password hashing/verification: Handled by better-auth and PrismaAuthAdapter
}
