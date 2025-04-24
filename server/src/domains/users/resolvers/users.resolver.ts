import { checkPermissions } from "@/domains/auth/utils/permission-utils";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors";
import {
  CreateTenantUserDto,
  UpdateUserDto,
  UserIdDto,
} from "../dto/users.dto";
import { usersService } from "../services/users.service";

export const usersResolvers = {
  Query: {
    /**
     * Get all users
     */
    users: async (_: any, __: any, context: GraphQLContext) => {
      // Check permissions
      await checkPermissions(context, "viewOrganization", "user", "view");

      return usersService.getAllUsers();
    },

    /**
     * Get user by ID
     */
    user: async (_: any, { id }: UserIdDto, context: GraphQLContext) => {
      // Check permissions
      await checkPermissions(context, "viewOrganization", "user", "view");

      return usersService.getUserById(id);
    },

    /**
     * Get tenants with user accounts for organization
     */
    tenantUsers: async (_: any, __: any, context: GraphQLContext) => {
      // Check permissions
      await checkPermissions(context, "viewTenants", "tenant", "view");

      const { organizationId } = context;

      if (!organizationId) {
        throw new AuthorizationError("No active organization selected");
      }

      return usersService.getTenantUsersByOrganization(organizationId);
    },
  },

  Mutation: {
    /**
     * Update a user
     */
    updateUser: async (
      _: any,
      { data }: { data: UpdateUserDto },
      context: GraphQLContext
    ) => {
      // Check if user is updating themselves or has admin permissions
      if (data.id === context.user?.id) {
        // Users can update their own profile
      } else {
        // Otherwise need permission to manage users
        await checkPermissions(context, "manageOrganization", "user", "update");
      }

      return usersService.updateUser(data.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        image: data.image,
        address: data.address,
        city: data.city,
        country: data.country,
        bio: data.bio,
        isActive: data.isActive,
      });
    },

    /**
     * Delete a user
     */
    deleteUser: async (_: any, { id }: UserIdDto, context: GraphQLContext) => {
      // Check permissions
      await checkPermissions(context, "manageOrganization", "user", "delete");

      // Cannot delete yourself
      if (id === context.user?.id) {
        throw new Error("You cannot delete your own account");
      }

      await usersService.deleteUser(id);
      return true;
    },

    /**
     * Create tenant user for portal access
     */
    createTenantUser: async (
      _: any,
      { data }: { data: CreateTenantUserDto },
      context: GraphQLContext
    ) => {
      // Check permissions
      await checkPermissions(context, "manageTenants", "tenant", "update");

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

  // Field resolvers for User type
  User: {
    ownedOrganizations: async (user: any, _: any, context: GraphQLContext) => {
      // Get organizations where user is the owner
      return (
        context.organizationsService?.getOrganizationsOwnedByUser(user.id) || []
      );
    },

    organizationMemberships: async (
      user: any,
      _: any,
      context: GraphQLContext
    ) => {
      // Get all memberships
      return context.organizationsService?.getUserMemberships(user.id) || [];
    },

    ownedProperties: async (user: any, _: any, context: GraphQLContext) => {
      // Get properties owned by user
      return context.propertiesService?.getPropertiesByOwner(user.id) || [];
    },

    caretakerProperties: async (user: any, _: any, context: GraphQLContext) => {
      // Get properties where user is caretaker
      return context.propertiesService?.getPropertiesByCaretaker(user.id) || [];
    },
  },
};
