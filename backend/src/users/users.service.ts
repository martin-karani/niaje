import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaAuthAdapter } from '../auth/config/prisma-adapter';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private prismaAuthAdapter: PrismaAuthAdapter,
  ) {}

  // Get a user's complete profile
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        profileImage: true,
        address: true,
        city: true,
        country: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get role-specific information
    let roleInfo = {};

    switch (user.role) {
      case UserRole.LANDLORD:
        // Get properties owned by this landlord
        const propertiesOwned = await this.prisma.property.count({
          where: { ownerId: userId },
        });
        roleInfo = { propertiesOwned };
        break;

      case UserRole.CARETAKER:
        // Get properties managed by this caretaker
        const propertiesManaged = await this.prisma.property.count({
          where: { caretakerId: userId },
        });
        roleInfo = { propertiesManaged };
        break;

      case UserRole.AGENT:
        // Get properties handled by this agent
        const propertiesAgented = await this.prisma.property.count({
          where: { agentId: userId },
        });
        roleInfo = { propertiesAgented };
        break;
    }

    return {
      ...user,
      ...roleInfo,
    };
  }

  // Update a user's profile
  async updateUserProfile(userId: string, data: Partial<User>) {
    // Prevent updating sensitive fields
    const { password, role, isActive, emailVerified, ...updateData } = data;

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        profileImage: true,
        address: true,
        city: true,
        country: true,
        bio: true,
      },
    });
  }

  // Get all users (for admin)
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
    });
  }

  // Check if a landlord can access another user's data
  async canLandlordAccessUser(
    landlordId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if the user is a caretaker or agent for any of the landlord's properties
    const property = await this.prisma.property.findFirst({
      where: {
        ownerId: landlordId,
        OR: [{ caretakerId: userId }, { agentId: userId }],
      },
    });

    return !!property;
  }

  // Create a new user (admin function)
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  }) {
    // Check if email already exists
    const existingUser = await this.prismaAuthAdapter.findUserByEmail(
      userData.email,
    );

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Create the user with the auth adapter
    const user = await this.prismaAuthAdapter.createUser({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role,
    });

    // Update additional profile information
    if (
      userData.phone ||
      userData.address ||
      userData.city ||
      userData.country
    ) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          country: userData.country,
        },
      });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
