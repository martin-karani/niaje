import { checkPermissions } from "@infrastructure/auth/permissions"; // Placeholder permission check
import { GraphQLContext } from "@infrastructure/graphql/context/types"; // Adjusted path
import { AuthorizationError } from "@shared/errors/authorization.error"; // Adjusted path
import {
  ChangePasswordDto,
  CreateTenantUserDto,
  CreateUserDto,
  UpdateUserDto,
  UserIdDto,
} from "../dto/user.dto";
import { usersService } from "../services/users.service";

export const usersResolvers = {
  Query: {
    // Get current authenticated user
    me: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthorizationError("Not authenticated");
      }
      return usersService.getUserById(context.user.id);
    },

    // Get all users (admin only)
    users: async (_: any, __: any, context: GraphQLContext) => {
      checkPermissions(context, "canManageUsers");
      return usersService.getAllUsers();
    },

    // Get user by ID
    user: async (_: any, { id }: UserIdDto, context: GraphQLContext) => {
      checkPermissions(context, "canManageUsers");
      return usersService.getUserById(id);
    },

    // Get tenants with user accounts for portal access
    tenantUsers: async (_: any, __: any, context: GraphQLContext) => {
      const { organizationId } = checkPermissions(context, "canManageUsers");
      return usersService.getTenantUsersByOrganization(organizationId);
    },
  },

  Mutation: {
    // Create new user
    createUser: async (
      _: any,
      { data }: { data: CreateUserDto },
      context: GraphQLContext
    ) => {
      checkPermissions(context, "canManageUsers");

      // Omit passwordConfirm as it's just for validation
      const { passwordConfirm, ...userData } = data;

      return usersService.createUser(userData);
    },

    // Update user
    updateUser: async (
      _: any,
      { data }: { data: UpdateUserDto },
      context: GraphQLContext
    ) => {
      // Allow users to update their own profile or admins to update any user
      if (data.id !== context.user?.id) {
        checkPermissions(context, "canManageUsers");
      }

      return usersService.updateUser(data.id, data);
    },

    // Delete user
    deleteUser: async (_: any, { id }: UserIdDto, context: GraphQLContext) => {
      checkPermissions(context, "canManageUsers");

      // Prevent self-deletion
      if (id === context.user?.id) {
        throw new AuthorizationError("Cannot delete your own account");
      }

      await usersService.deleteUser(id);
      return true;
    },

    // Change password
    changePassword: async (
      _: any,
      { data }: { data: ChangePasswordDto },
      context: GraphQLContext
    ) => {
      // Allow users to change their own password or admins to change any password
      if (data.id !== context.user?.id) {
        checkPermissions(context, "canManageUsers");
      }

      return usersService.changePassword(
        data.id,
        data.currentPassword,
        data.newPassword
      );
    },

    // Create tenant user for portal access
    createTenantUser: async (
      _: any,
      { data }: { data: CreateTenantUserDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkPermissions(context, "canManageTenants");

      return usersService.createTenantUser({
        email: data.email,
        name: data.name,
        phone: data.phone,
        tenantId: data.tenantId,
        password: data.password,
        sendCredentials: data.sendCredentials,
      });
    },
  },
};

// Placeholder permission check function
// Replace with your actual permission logic
function checkPermissions(
  context: GraphQLContext,
  permission: string
): { organizationId: string } {
  const { organization, user } = context;

  if (!user) {
    throw new AuthorizationError("Not authenticated");
  }

  if (
    permission === "canManageUsers" &&
    user.role !== "admin" &&
    user.role !== "agent_owner"
  ) {
    throw new AuthorizationError("You don't have permission to manage users");
  }

  if (
    permission === "canManageTenants" &&
    user.role !== "admin" &&
    user.role !== "agent_owner" &&
    user.role !== "agent_staff"
  ) {
    throw new AuthorizationError("You don't have permission to manage tenants");
  }

  if (!organization) {
    throw new Error("No active organization selected");
  }

  return { organizationId: organization.id };
}
