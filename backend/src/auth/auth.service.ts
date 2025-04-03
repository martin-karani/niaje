import { Injectable, Inject } from '@nestjs/common';
import { PrismaAuthAdapter } from './config/prisma-adapter';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_INSTANCE') private auth: any,
    private prismaAuthAdapter: PrismaAuthAdapter,
    private prisma: PrismaService,
  ) {}

  // Validate if a user session exists
  async validateSession(headers: any) {
    try {
      const session = await this.auth.api.getSession({ headers });
      return session;
    } catch (error) {
      return null;
    }
  }

  // Get the auth instance
  getAuthInstance() {
    return this.auth;
  }

  // Get user by ID with role-specific information
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      return null;
    }

    // Depending on the user role, get additional information
    let additionalInfo = {};

    switch (user.role) {
      case UserRole.LANDLORD:
        additionalInfo = {
          propertiesOwned: await this.prisma.property.count({
            where: { ownerId: user.id },
          }),
        };
        break;
      case UserRole.CARETAKER:
        additionalInfo = {
          propertiesManaged: await this.prisma.property.count({
            where: { caretakerId: user.id },
          }),
        };
        break;
      case UserRole.AGENT:
        additionalInfo = {
          propertiesAgented: await this.prisma.property.count({
            where: { agentId: user.id },
          }),
        };
        break;
    }

    return {
      ...user,
      ...additionalInfo,
    };
  }

  // Update user profile
  async updateUserProfile(id: string, data: Partial<User>) {
    // Prevent updating sensitive fields
    const { password, role, isActive, emailVerified, ...updateData } = data;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  // Create a new auth record - implement to match controller
  async create(createAuthDto: CreateAuthDto) {
    // This could be a placeholder or implement actual functionality
    return { message: 'Auth record created', data: createAuthDto };
  }

  // Find all auth records - implement to match controller
  async findAll() {
    // This could return a list of users or auth records
    return { message: 'List of auth records' };
  }

  // Find one auth record by ID - implement to match controller
  async findOne(id: number) {
    // This could return a specific user or auth record
    return { message: `Auth record with ID: ${id}` };
  }

  // Update an auth record - implement to match controller
  async update(id: number, updateAuthDto: UpdateAuthDto) {
    // This could update a specific user or auth record
    return { message: `Auth record ${id} updated`, data: updateAuthDto };
  }

  // Remove an auth record - implement to match controller
  async remove(id: number) {
    // This could delete a specific user or auth record
    return { message: `Auth record ${id} removed` };
  }
}
