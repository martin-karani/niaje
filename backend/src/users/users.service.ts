import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, Account } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    // Inject AUTH_INSTANCE if needed for admin actions like creating users via better-auth API
    @Inject('AUTH_INSTANCE') private auth: any,
  ) {}

  // Get a user's complete profile (keep as is, maybe refine selects)
  async getUserProfile(
    userId: string,
  ): Promise<Partial<User> & { roleInfo?: any }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        // Select fields appropriate for a profile view
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        image: true, // Use 'image' field
        address: true,
        city: true,
        country: true,
        bio: true,
        isActive: true, // Include if relevant for display
        emailVerified: true, // Include if relevant for display
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get role-specific information (keep this logic)
    let roleInfo = {};
    // ... (switch statement for role info based on counts)

    return {
      ...user,
      roleInfo, // Attach role-specific info
    };
  }

  // Update a user's profile (keep as is - already handles sensitive fields)
  async updateUserProfile(
    userId: string,
    data: Partial<User>,
  ): Promise<Partial<User>> {
    const { password, role, isActive, emailVerified, email, ...updateData } =
      data;
    // Rename profileImage to image if schema was updated
    if ('profileImage' in updateData && updateData.profileImage !== undefined) {
      updateData.image = updateData.profileImage;
      delete updateData.profileImage;
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
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
          updatedAt: true,
        },
      });
      return updatedUser;
    } catch (error) {
      // Check for Prisma error indicating record not found
      if (error.code === 'P2025') {
        // Prisma code for record not found on update/delete
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }
      console.error('Error updating user profile:', error);
      throw new BadRequestException('Could not update user profile.');
    }
  }

  // Get all users (for admin) (keep as is)
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Check if a landlord can access another user's data (keep as is)
  async canLandlordAccessUser(
    landlordId: string,
    userId: string,
  ): Promise<boolean> {
    const property = await this.prisma.property.findFirst({
      where: {
        ownerId: landlordId,
        OR: [{ caretakerId: userId }, { agentId: userId }],
      },
    });
    return !!property;
  }

  // --- Refactored Admin User Creation ---
  // This function is now simplified. It creates the basic user record.
  // Authentication setup (creating the Account) should happen via better-auth flows
  // (e.g., invite email, or admin using a better-auth API if available).
  // We *don't* handle passwords here directly anymore.
  async adminCreateUser(userData: {
    email: string;
    name: string;
    role?: UserRole;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    // NO PASSWORD HERE
  }): Promise<Partial<User>> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Create the basic User record
    const newUser = await this.prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role || UserRole.LANDLORD, // Default role
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        country: userData.country,
        // emailVerified defaults to false, isActive defaults to true per schema
      },
      select: {
        // Return only non-sensitive fields
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
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // IMPORTANT: Inform the admin/user that the account needs activation/password setup
    // This might involve sending an invite or instructing the user to reset password.
    // How depends on your preferred workflow and better-auth capabilities.
    // Example: await this.auth.api.sendPasswordResetEmail({ email: newUser.email });

    return newUser;
  }
}
