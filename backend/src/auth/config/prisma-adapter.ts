import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PrismaAuthAdapter {
  constructor(private prisma: PrismaService) {}

  // Find a user by email
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Find a user by ID
  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Create a new user
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    return this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || UserRole.LANDLORD,
      },
    });
  }

  // Verify a password against a hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Validate user credentials
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // Create a session
  async createSession(
    userId: string,
    expiresAt: Date,
    sessionData?: any,
  ): Promise<string> {
    const sessionId = crypto.randomUUID();

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        expiresAt,
        data: sessionData || {},
      },
    });

    return sessionId;
  }

  // Get a session by ID
  async getSession(sessionId: string): Promise<any | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || new Date() > session.expiresAt) {
      return null;
    }

    // Get the user associated with this session
    const user = await this.findUserById(session.userId);

    if (!user) {
      return null;
    }

    // Remove sensitive fields
    const { password, ...userWithoutPassword } = user;

    return {
      sessionId: session.id,
      user: userWithoutPassword,
      expiresAt: session.expiresAt,
      ...(session.data || {}),
    };
  }

  // Delete a session
  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.session
      .delete({
        where: { id: sessionId },
      })
      .catch(() => {
        // Ignore errors if session doesn't exist
      });
  }

  // Delete all sessions for a user
  async deleteUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  // Create a token (for password reset, email verification, etc.)
  async createToken(
    type: 'RESET_PASSWORD' | 'VERIFY_EMAIL' | 'REFRESH',
    userId: string,
    expiresIn: string | number,
  ): Promise<string> {
    const token = crypto.randomUUID();
    const expires = new Date();

    // Convert expiresIn to milliseconds if it's a string like '1h', '1d', etc.
    if (typeof expiresIn === 'string') {
      const unit = expiresIn.charAt(expiresIn.length - 1);
      const value = parseInt(expiresIn.slice(0, -1));

      switch (unit) {
        case 'h':
          expires.setHours(expires.getHours() + value);
          break;
        case 'd':
          expires.setDate(expires.getDate() + value);
          break;
        case 'm':
          expires.setMinutes(expires.getMinutes() + value);
          break;
        default:
          expires.setSeconds(expires.getSeconds() + parseInt(expiresIn));
      }
    } else {
      // If expiresIn is a number, assume it's in seconds
      expires.setSeconds(expires.getSeconds() + expiresIn);
    }

    await this.prisma.token.create({
      data: {
        token,
        type: type as any, // Cast to any because Prisma expects the exact enum value
        expires,
        userId,
      },
    });

    return token;
  }

  // Validate a token
  async validateToken(
    token: string,
    type: 'RESET_PASSWORD' | 'VERIFY_EMAIL' | 'REFRESH',
  ): Promise<{ userId: string } | null> {
    const tokenRecord = await this.prisma.token.findFirst({
      where: {
        token,
        type: type as any,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!tokenRecord) {
      return null;
    }

    return { userId: tokenRecord.userId };
  }

  // Delete a token
  async deleteToken(token: string): Promise<void> {
    await this.prisma.token.deleteMany({
      where: { token },
    });
  }
}
