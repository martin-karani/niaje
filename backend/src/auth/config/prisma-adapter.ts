import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Account, Session, Verification, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaAuthAdapter {
  constructor(private prisma: PrismaService) {}

  // --- User Methods ---
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // Creates only the User record. Account creation is separate.
  async createUser(
    userData: Partial<User> & { email: string; name: string },
  ): Promise<User> {
    // Remove password if accidentally passed, should be handled in createAccount
    const { password, ...restUserData } = userData;
    return this.prisma.user.create({
      data: {
        ...restUserData,
        role: restUserData.role || UserRole.LANDLORD, // Default role if not provided
      },
    });
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    // Prevent updating sensitive fields managed by better-auth or specific logic
    const { password, role, isActive, emailVerified, email, ...updateData } =
      data;
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error) {
      // Handle potential errors like user not found
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(userId: string): Promise<User | null> {
    // Ensure related data (sessions, accounts, verifications) is deleted via schema cascade or manually
    try {
      return await this.prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      console.error('Error deleting user:', error);
      return null;
    }
  }

  // --- Account Methods ---
  // Used internally by better-auth or explicitly for email/password
  async createAccount(accountData: {
    userId: string;
    providerId: string; // e.g., 'emailpassword', 'google'
    accountId: string; // For 'emailpassword', often same as userId. For OAuth, provider's user ID.
    password?: string; // Only for 'emailpassword'
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: Date;
    // ... other OAuth fields
  }): Promise<Account> {
    let hashedPassword: string | undefined = undefined;
    if (accountData.providerId === 'emailpassword' && accountData.password) {
      hashedPassword = await bcrypt.hash(accountData.password, 10);
    } else if (
      accountData.providerId === 'emailpassword' &&
      !accountData.password
    ) {
      // Handle case where password is required but missing for emailpassword
      console.error(
        `Password missing for emailpassword account creation for user ${accountData.userId}`,
      );
      throw new InternalServerErrorException(
        'Password is required for email/password account.',
      );
    }

    return this.prisma.account.create({
      data: {
        userId: accountData.userId,
        providerId: accountData.providerId,
        accountId: accountData.accountId,
        password: hashedPassword, // Store hashed password here
        accessToken: accountData.accessToken,
        refreshToken: accountData.refreshToken,
        accessTokenExpiresAt: accountData.accessTokenExpiresAt,
        // ... map other fields
      },
    });
  }

  async findAccountByProvider(
    providerId: string,
    accountId: string,
  ): Promise<(Account & { user: User }) | null> {
    return this.prisma.account.findUnique({
      where: { providerId_accountId: { providerId, accountId } },
      include: { user: true }, // Include user data
    });
  }

  async findUserByAccountId(
    providerId: string,
    accountId: string,
  ): Promise<User | null> {
    const account = await this.findAccountByProvider(providerId, accountId);
    return account?.user ?? null;
  }

  async deleteAccount(
    providerId: string,
    accountId: string,
  ): Promise<Account | null> {
    try {
      return await this.prisma.account.delete({
        where: { providerId_accountId: { providerId, accountId } },
      });
    } catch (error) {
      console.error(
        `Error deleting account (${providerId}/${accountId}):`,
        error,
      );
      return null;
    }
  }

  async linkAccount(
    accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Account> {
    // Similar to createAccount, ensure password hashing if needed
    let hashedPassword = accountData.password;
    if (accountData.providerId === 'emailpassword' && accountData.password) {
      hashedPassword = await bcrypt.hash(accountData.password, 10);
    }
    return this.prisma.account.create({
      data: {
        ...accountData,
        password: hashedPassword,
      },
    });
  }

  async unlinkAccount(
    providerId: string,
    accountId: string,
  ): Promise<Account | null> {
    return this.deleteAccount(providerId, accountId);
  }

  // --- Session Methods ---
  async createSession(sessionData: {
    userId: string;
    expiresAt: Date;
    token: string; // better-auth usually provides this
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Session> {
    // Let Prisma handle ID generation with @default(cuid())
    return this.prisma.session.create({
      data: {
        userId: sessionData.userId,
        expiresAt: sessionData.expiresAt,
        token: sessionData.token,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        // data: sessionData.data || {}, // Keep if you use the 'data' field
      },
    });
  }

  // Get a session by the unique session token provided by better-auth
  async getSession(
    sessionToken: string,
  ): Promise<(Session & { user: User }) | null> {
    const session = await this.prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          // Include user data, excluding password from the related user
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            image: true,
            phone: true,
            role: true,
            isActive: true,
            address: true,
            city: true,
            country: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!session || !session.user || new Date() > session.expiresAt) {
      if (session) {
        // Clean up expired session asynchronously
        this.deleteSession(session.token).catch((err) =>
          console.error('Failed to delete expired session:', err),
        );
      }
      return null;
    }

    // User is already included and selected without password
    return session;
  }

  async updateSession(
    sessionToken: string,
    data: Partial<Session>,
  ): Promise<Session | null> {
    try {
      return await this.prisma.session.update({
        where: { token: sessionToken },
        data: data,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      return null;
    }
  }

  // Delete a session by its unique token
  async deleteSession(sessionToken: string): Promise<Session | null> {
    try {
      return await this.prisma.session.delete({
        where: { token: sessionToken },
      });
    } catch (error) {
      // Ignore errors if session doesn't exist
      // console.error("Error deleting session:", error);
      return null;
    }
  }

  // Delete all sessions for a user (e.g., on sign out everywhere)
  async deleteUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  // --- Verification (Token) Methods ---
  // Use Verification model now
  async createVerification(data: {
    identifier: string; // e.g., 'email', 'password-reset'
    value: string; // The unique token value
    expiresAt: Date;
    userId?: string; // Optional link to user
  }): Promise<Verification> {
    // Let Prisma handle ID generation
    return this.prisma.verification.create({
      data: {
        identifier: data.identifier,
        value: data.value,
        expiresAt: data.expiresAt,
        userId: data.userId,
      },
    });
  }

  // Find a verification record by its identifier and value
  async findVerification(
    identifier: string,
    value: string,
  ): Promise<Verification | null> {
    return this.prisma.verification.findFirst({
      where: {
        identifier,
        value,
        expiresAt: {
          gt: new Date(), // Only find non-expired ones
        },
      },
    });
  }

  // Delete verification records by identifier and value
  async deleteVerification(identifier: string, value: string): Promise<void> {
    await this.prisma.verification.deleteMany({
      where: { identifier, value },
    });
  }

  // --- Helper Methods ---
  // Keep password verification helper
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false; // Cannot compare if one is missing
    }
    return bcrypt.compare(password, hash);
  }

  // Potentially needed for credential validation if better-auth delegates fully
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<(User & { account: Account }) | null> {
    const account = await this.prisma.account.findFirst({
      where: {
        providerId: 'emailpassword', // Specific provider
        user: { email: email }, // Find account via user's email
      },
      include: { user: true },
    });

    if (!account || !account.password || !account.user) {
      return null; // No emailpassword account found for this email or password not set
    }

    const isPasswordValid = await this.verifyPassword(
      password,
      account.password,
    );
    if (!isPasswordValid) {
      return null;
    }

    // Exclude password from returned user object if needed, although it's from Account here
    const { password: _, ...userAccountInfo } = account;

    return { ...account.user, account: userAccountInfo };
  }
}
