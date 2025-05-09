import {
  userEntity,
  verificationEntity,
  type User,
} from "@/domains/users/entities/user.entity";
import { db } from "@/infrastructure/database";
import emailService from "@/infrastructure/email/email.service";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors";
import {
  generateToken,
  hashPassword,
  verifyPassword,
} from "@/shared/utils/auth.utils";
import { and, eq } from "drizzle-orm";
import { sessionService } from "./session.service";

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ user: User; sessionToken?: string }> {
    // Check if email already exists
    const existingUser = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, data.email.toLowerCase()),
    });

    if (existingUser) {
      throw new ValidationError("Email already in use");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const [user] = await db
      .insert(userEntity)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send verification email if required
    await this.sendEmailVerification(user.id, user.email);

    let sessionToken;
    // Create session if email verification not required
    sessionToken = await sessionService.createSession({
      userId: user.id,
      ipAddress: null,
      userAgent: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      data: {},
    });

    console.log("Session created:", sessionToken);

    return { user, sessionToken };
  }

  /**
   * Login a user
   */
  async login(data: {
    email: string;
    password: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ user: User; sessionToken: string }> {
    // Find user by email
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, data.email.toLowerCase()),
    });

    if (!user) {
      throw new ValidationError("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthorizationError("Your account has been deactivated");
    }

    // Check if user is banned
    if (user.banned) {
      if (user.banExpires && user.banExpires.getTime() < Date.now()) {
        // Ban has expired, remove ban
        await db
          .update(userEntity)
          .set({
            banned: false,
            banReason: null,
            banExpires: null,
            updatedAt: new Date(),
          })
          .where(eq(userEntity.id, user.id));
      } else {
        throw new AuthorizationError(
          `Your account has been banned. Reason: ${user.banReason || "N/A"}`
        );
      }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AuthorizationError(
        "Please verify your email before logging in"
      );
    }

    // Verify password
    if (!user.passwordHash) {
      throw new ValidationError("Invalid email or password");
    }

    const isPasswordValid = await verifyPassword(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new ValidationError("Invalid email or password");
    }

    // Create session
    const sessionToken = await sessionService.createSession({
      userId: user.id,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      data: {},
    });

    // Update last login timestamp
    await db
      .update(userEntity)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userEntity.id, user.id));

    return { user, sessionToken };
  }

  /**
   * Logout a user
   */
  async logout(sessionToken: string): Promise<void> {
    await sessionService.deleteSession(sessionToken);
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await db.insert(verificationEntity).values({
      userId,
      token, // Use token instead of 'value'
      type: "email_verification", // Use type instead of 'identifier'
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Build verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    // Send verification email
    await emailService.sendVerificationEmail({
      user: { email, name: user.name || email },
      url: verificationUrl,
      token,
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    // Find verification entry
    const verification = await db.query.verificationEntity.findFirst({
      where: and(
        eq(verificationEntity.type, "email_verification"),
        eq(verificationEntity.token, token)
      ),
    });

    if (!verification) {
      throw new ValidationError("Invalid or expired verification token");
    }

    // Check if token is expired
    if (verification.expiresAt < new Date()) {
      // Delete expired token
      await db
        .delete(verificationEntity)
        .where(eq(verificationEntity.id, verification.id));

      throw new ValidationError("Verification token has expired");
    }

    // Update user as verified
    const [updatedUser] = await db
      .update(userEntity)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(userEntity.id, verification.userId))
      .returning();

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    // Delete verification token
    await db
      .delete(verificationEntity)
      .where(eq(verificationEntity.id, verification.id));

    return updatedUser;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, email.toLowerCase()),
    });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token
    await db.insert(verificationEntity).values({
      userId: user.id,
      token,
      type: "password_reset",
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    // Send reset email
    await emailService.sendResetPasswordEmail({
      user: { email, name: user.name || email },
      url: resetUrl,
      token,
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<User> {
    // Find verification entry
    const verification = await db.query.verificationEntity.findFirst({
      where: and(
        eq(verificationEntity.type, "password_reset"),
        eq(verificationEntity.token, token)
      ),
    });

    if (!verification) {
      throw new ValidationError("Invalid or expired reset token");
    }

    // Check if token is expired
    if (verification.expiresAt < new Date()) {
      // Delete expired token
      await db
        .delete(verificationEntity)
        .where(eq(verificationEntity.id, verification.id));

      throw new ValidationError("Reset token has expired");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user's password
    const [updatedUser] = await db
      .update(userEntity)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(userEntity.id, verification.userId))
      .returning();

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    // Delete verification token
    await db
      .delete(verificationEntity)
      .where(eq(verificationEntity.id, verification.id));

    // Invalidate all sessions for this user
    await sessionService.deleteUserSessions(updatedUser.id);

    return updatedUser;
  }

  /**
   * Change password (when user is logged in)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Get user
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new ValidationError("Current password is incorrect");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await db
      .update(userEntity)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(userEntity.id, userId));

    return true;
  }

  /**
   * Change email (initiates verification process)
   */
  async changeEmail(userId: string, newEmail: string): Promise<void> {
    // Check if user exists
    const user = await db.query.userEntity.findFirst({
      where: eq(userEntity.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if new email is already in use
    const existingUser = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, newEmail.toLowerCase()),
    });

    if (existingUser) {
      throw new ValidationError("Email already in use");
    }

    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token with new email
    await db.insert(verificationEntity).values({
      userId,
      token,
      type: "email_change",
      email: newEmail.toLowerCase(),
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Build verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email-change?token=${token}`;

    // Send verification email to new address
    await emailService.sendChangeEmailVerification({
      user: { email: user.email, name: user.name || user.email },
      newEmail,
      url: verificationUrl,
      token,
    });
  }

  /**
   * Verify email change with token
   */
  async verifyEmailChange(token: string): Promise<User> {
    // Find verification entry
    const verification = await db.query.verificationEntity.findFirst({
      where: and(
        eq(verificationEntity.type, "email_change"),
        eq(verificationEntity.token, token)
      ),
    });

    if (!verification || !verification.email) {
      throw new ValidationError("Invalid or expired verification token");
    }

    // Check if token is expired
    if (verification.expiresAt < new Date()) {
      // Delete expired token
      await db
        .delete(verificationEntity)
        .where(eq(verificationEntity.id, verification.id));

      throw new ValidationError("Verification token has expired");
    }

    const newEmail = verification.email;

    // Check again if email is available (could have been taken since token was generated)
    const existingUser = await db.query.userEntity.findFirst({
      where: eq(userEntity.email, newEmail),
    });

    if (existingUser) {
      throw new ValidationError("Email already in use");
    }

    // Update user's email
    const [updatedUser] = await db
      .update(userEntity)
      .set({
        email: newEmail,
        updatedAt: new Date(),
      })
      .where(eq(userEntity.id, verification.userId))
      .returning();

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    // Delete verification token
    await db
      .delete(verificationEntity)
      .where(eq(verificationEntity.id, verification.id));

    return updatedUser;
  }
}

export const authService = new AuthService();
