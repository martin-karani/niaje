import { AuthInstance } from "@/configs/auth.config";
import { ConflictError, NotFoundError, PermissionError } from "@/errors";
import * as bcrypt from "bcrypt";
import {
  AdminChangePasswordDto,
  UpdateProfileDto,
  UpdateUserDto,
  UserFilterDto,
} from "../dto/users.dto";
import { usersRepository } from "../repositories/users.repository";
import {
  RolePermissions,
  UserProfile,
  UserStats,
  UserWithProperties,
} from "../types";

export class UsersService {
  constructor(private authInstance: AuthInstance) {}

  /**
   * Get users with pagination and filtering
   */
  async getUsers(
    filters: UserFilterDto,
    requestingUserRole: string
  ): Promise<{ users: UserProfile[]; total: number; pages: number }> {
    // Only admins can view all users unrestricted
    if (requestingUserRole !== "ADMIN") {
      throw new PermissionError(
        "Only administrators can view the complete user list"
      );
    }

    const users = await usersRepository.findAll(filters);
    const total = await usersRepository.countUsers(filters);
    const pages = Math.ceil(total / (filters.limit || 20));

    return { users, total, pages };
  }

  /**
   * Get a user by ID with relationships
   */
  async getUserById(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<UserWithProperties> {
    const user = await usersRepository.findById(userId, true);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Users can view their own profile, admins can view any profile
    if (userId !== requestingUserId && requestingUserRole !== "ADMIN") {
      // For non-admins viewing other users, we'll restrict sensitive data
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
   * Update a user (admin only or self-update)
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

    // Only admins can update other users
    if (userId !== requestingUserId && requestingUserRole !== "ADMIN") {
      throw new PermissionError("You can only update your own profile");
    }

    // Non-admins cannot change their own role
    if (
      userId === requestingUserId &&
      requestingUserRole !== "ADMIN" &&
      userData.role &&
      userData.role !== user.role
    ) {
      throw new PermissionError("You cannot change your own role");
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
   */
  async updateProfile(
    userId: string,
    profileData: UpdateProfileDto,
    requestingUserId: string
  ): Promise<UserProfile> {
    // Users can only update their own profile
    if (userId !== requestingUserId) {
      throw new PermissionError("You can only update your own profile");
    }

    // Check if user exists
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return usersRepository.updateProfile(userId, profileData);
  }

  /**
   * Admin change user password - note that this works with better-auth
   * but should typically be done through better-auth's reset password functionality
   */
  async adminChangePassword(
    data: AdminChangePasswordDto,
    requestingUserRole: string
  ): Promise<{ success: boolean }> {
    // Only admins can change other users' passwords
    if (requestingUserRole !== "ADMIN") {
      throw new PermissionError(
        "Only administrators can change other users' passwords"
      );
    }

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
   */
  async setActiveStatus(
    userId: string,
    isActive: boolean,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<UserProfile> {
    // Only admins can deactivate/activate accounts
    if (requestingUserRole !== "ADMIN") {
      throw new PermissionError(
        "Only administrators can activate or deactivate accounts"
      );
    }

    // Prevent deactivating your own account
    if (userId === requestingUserId && !isActive) {
      throw new PermissionError("You cannot deactivate your own account");
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
   */
  async deleteUser(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<{ success: boolean }> {
    // Only admins can delete users
    if (requestingUserRole !== "ADMIN") {
      throw new PermissionError("Only administrators can delete users");
    }

    // Prevent deleting your own account
    if (userId === requestingUserId) {
      throw new PermissionError("You cannot delete your own account");
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
   * Get user statistics (admin only)
   */
  async getUserStats(requestingUserRole: string): Promise<UserStats> {
    if (requestingUserRole !== "ADMIN") {
      throw new PermissionError("Only administrators can view user statistics");
    }

    return usersRepository.getUserStats();
  }

  /**
   * Get permissions for a specific role
   */
  getRolePermissions(role: string): RolePermissions {
    // Define permission presets for each role
    const rolePermissions: Record<string, RolePermissions> = {
      ADMIN: {
        role: "ADMIN",
        permissions: {
          canManageUsers: true,
          canManageRoles: true,
          canManageProperties: true,
          canManageTenants: true,
          canManageLeases: true,
          canManagePayments: true,
          canViewReports: true,
          canManageMaintenance: true,
        },
      },
      LANDLORD: {
        role: "LANDLORD",
        permissions: {
          canManageUsers: false,
          canManageRoles: false,
          canManageProperties: true,
          canManageTenants: true,
          canManageLeases: true,
          canManagePayments: true,
          canViewReports: true,
          canManageMaintenance: true,
        },
      },
      CARETAKER: {
        role: "CARETAKER",
        permissions: {
          canManageUsers: false,
          canManageRoles: false,
          canManageProperties: false,
          canManageTenants: true,
          canManageLeases: false,
          canManagePayments: true,
          canViewReports: false,
          canManageMaintenance: true,
        },
      },
      AGENT: {
        role: "AGENT",
        permissions: {
          canManageUsers: false,
          canManageRoles: false,
          canManageProperties: false,
          canManageTenants: true,
          canManageLeases: true,
          canManagePayments: false,
          canViewReports: false,
          canManageMaintenance: false,
        },
      },
    };

    return (
      rolePermissions[role] || {
        role: "UNKNOWN",
        permissions: {
          canManageUsers: false,
          canManageRoles: false,
          canManageProperties: false,
          canManageTenants: false,
          canManageLeases: false,
          canManagePayments: false,
          canViewReports: false,
          canManageMaintenance: false,
        },
      }
    );
  }

  /**
   * Get all available roles with their permissions
   */
  getAllRolePermissions(): RolePermissions[] {
    const roles = ["ADMIN", "LANDLORD", "CARETAKER", "AGENT"];
    return roles.map((role) => this.getRolePermissions(role));
  }
}

// The service instance will be created when the auth instance is available
// This will be used in the route handlers
