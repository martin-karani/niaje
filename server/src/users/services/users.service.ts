import { ConflictError, NotFoundError } from "@/errors";
import * as bcrypt from "bcrypt";
import {
  AdminChangePasswordDto,
  UpdateProfileDto,
  UpdateUserDto,
  UserFilterDto,
} from "../dto/users.dto";
import { usersRepository } from "../repository/users.repository";
import { UserProfile, UserStats, UserWithProperties } from "../types";

export class UsersService {
  /**
   * Get users with pagination and filtering
   * Permission check is handled by middleware
   */
  async getUsers(filters: UserFilterDto): Promise<{
    users: UserProfile[];
    total: number;
    pages: number;
  }> {
    const users = await usersRepository.findAll(filters);
    const total = await usersRepository.countUsers(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { users, total, pages };
  }

  /**
   * Get a user by ID with relationships
   * Permission check is handled by middleware
   */
  async getUserById(
    userId: string,
    requestingUserId: string
  ): Promise<UserWithProperties> {
    const user = await usersRepository.findById(userId, true);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // For users viewing other users' profiles, we'll restrict sensitive data
    if (userId !== requestingUserId) {
      // This could be extended based on your privacy requirements
      const restrictedUser = {
        ...user,
        email: user.email, // Keep email visible for communication
        phone: user.phone, // Keep phone visible for communication
        // Remove sensitive fields
        address: null,
        city: null,
        country: null,
        bio: user.bio,
        // Keep properties visible since they're likely working with them
      };

      return restrictedUser;
    }

    return user;
  }

  /**
   * Update a user
   * Permission check is handled by middleware
   */
  async updateUser(
    userId: string,
    userData: UpdateUserDto,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<UserProfile> {
    // Check if user exists
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Non-admins cannot change their own role
    if (
      userId === requestingUserId &&
      requestingUserRole !== "ADMIN" &&
      userData.role &&
      userData.role !== user.role
    ) {
      throw new ConflictError("You cannot change your own role");
    }

    // If email is being changed, check for conflicts
    if (userData.email && userData.email !== user.email) {
      const existingUser = await usersRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("A user with this email already exists");
      }

      // Email changes should be handled through better-auth
      // We'll skip changing email as that should be done through better-auth's interface
      delete userData.email;
    }

    return usersRepository.update(userId, userData);
  }

  /**
   * Update profile (limited self-update)
   * Permission check is handled by middleware
   */
  async updateProfile(
    userId: string,
    profileData: UpdateProfileDto
  ): Promise<UserProfile> {
    // Check if user exists
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return usersRepository.updateProfile(userId, profileData);
  }

  /**
   * Admin change user password
   * Permission check is handled by middleware
   */
  async adminChangePassword(
    data: AdminChangePasswordDto
  ): Promise<{ success: boolean }> {
    try {
      // For admin password resets, we'll use better-auth's internal functionality
      // This is a placeholder - in practice, admins should use better-auth's UI
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await usersRepository.updatePassword(data.userId, hashedPassword);

      return { success: true };
    } catch (error) {
      console.error("Error changing password:", error);
      throw new Error("Failed to change password");
    }
  }

  /**
   * Set user active/inactive status
   * Permission check is handled by middleware
   */
  async setActiveStatus(
    userId: string,
    isActive: boolean,
    requestingUserId: string
  ): Promise<UserProfile> {
    // Prevent deactivating your own account
    if (userId === requestingUserId && !isActive) {
      throw new ConflictError("You cannot deactivate your own account");
    }

    // Check if user exists
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return usersRepository.setActiveStatus(userId, isActive);
  }

  /**
   * Delete a user
   * Permission check is handled by middleware
   */
  async deleteUser(
    userId: string,
    requestingUserId: string
  ): Promise<{ success: boolean }> {
    // Prevent deleting your own account
    if (userId === requestingUserId) {
      throw new ConflictError("You cannot delete your own account");
    }

    // Check if user exists
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    try {
      // Delete user through repository
      await usersRepository.delete(userId);
      return { success: true };
    } catch (error: any) {
      if (error.message === "Cannot delete user who owns properties") {
        throw new ConflictError(
          "Cannot delete user who owns properties. Reassign or delete properties first."
        );
      }
      throw new Error("Failed to delete user");
    }
  }

  /**
   * Get user statistics
   * Permission check is handled by middleware
   */
  async getUserStats(): Promise<UserStats> {
    return usersRepository.getUserStats();
  }
}

// Export a singleton instance
export const usersService = new UsersService();
