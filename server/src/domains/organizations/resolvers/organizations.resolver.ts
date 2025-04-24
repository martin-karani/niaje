import { sessionService } from "@/infrastructure/auth/services/session.service";
import { GraphQLContext } from "@/infrastructure/graphql/context/types";
import { AuthorizationError } from "@/shared/errors/authorization.error";
import {
  CreateOrganizationDto,
  OrganizationIdDto,
  SwitchOrganizationDto,
  UpdateOrganizationDto,
} from "../dto/organization.dto";
import {
  invitationsService,
  membersService,
  organizationService,
  teamsService,
} from "../services";

export const organizationsResolvers = {
  Query: {
    myOrganizations: async (_: any, __: any, context: GraphQLContext) => {
      const { userId } = checkOrganizationPermissions(context, "view");
      return organizationService.getUserOrganizations(userId);
    },

    organization: async (
      _: any,
      { id }: OrganizationIdDto,
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "view");
      return organizationService.getOrganizationById(id);
    },

    organizationBySlug: async (
      _: any,
      { slug }: { slug: string },
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "view");
      return organizationService.getOrganizationBySlug(slug);
    },

    organizationMembers: async (
      _: any,
      { organizationId }: { organizationId: string },
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "view");
      return membersService.getOrganizationMembers(organizationId);
    },

    organizationTeams: async (
      _: any,
      { organizationId }: { organizationId: string },
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "view");
      return teamsService.getOrganizationTeams(organizationId);
    },

    organizationInvitations: async (
      _: any,
      { organizationId }: { organizationId: string },
      context: GraphQLContext
    ) => {
      const { userId } = checkOrganizationPermissions(context, "manage");
      return invitationsService.getOrganizationInvitations(organizationId);
    },

    validateInvitation: async (
      _: any,
      { token }: { token: string },
      _context: GraphQLContext
    ) => {
      try {
        const invitation = await invitationsService.getInvitationByToken(token);

        // Check if invitation is still valid
        if (invitation.status !== "pending") {
          return {
            valid: false,
            message: `Invitation has been ${invitation.status}`,
          };
        }

        if (new Date() > invitation.expiresAt) {
          return {
            valid: false,
            message: "Invitation has expired",
          };
        }

        return {
          valid: true,
          message: "Invitation is valid",
          invitation,
        };
      } catch (error) {
        return {
          valid: false,
          message: error.message || "Invalid invitation",
        };
      }
    },
  },

  Mutation: {
    createOrganization: async (
      _: any,
      { data }: { data: CreateOrganizationDto },
      context: GraphQLContext
    ) => {
      const { userId } = checkOrganizationPermissions(context, "view");
      return organizationService.createOrganization({ ...data, userId });
    },

    updateOrganization: async (
      _: any,
      { data }: { data: UpdateOrganizationDto },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkOrganizationPermissions(
        context,
        "manage"
      );

      // Only update current organization
      if (data.id !== organizationId) {
        throw new AuthorizationError(
          "You can only update the current organization"
        );
      }

      return organizationService.updateOrganization(data.id, data);
    },

    deleteOrganization: async (
      _: any,
      { id }: OrganizationIdDto,
      context: GraphQLContext
    ) => {
      const { organizationId } = checkOrganizationPermissions(context, "admin");

      // Only delete current organization
      if (id !== organizationId) {
        throw new AuthorizationError(
          "You can only delete the current organization"
        );
      }

      await organizationService.deleteOrganization(id);
      return true;
    },

    switchOrganization: async (
      _: any,
      { id }: SwitchOrganizationDto,
      context: GraphQLContext
    ) => {
      const { userId } = checkOrganizationPermissions(context, "view");

      // Check if user is a member of the organization
      const isMember = await organizationService.isUserMemberOfOrganization(
        userId,
        id
      );

      if (!isMember) {
        throw new AuthorizationError(
          "You are not a member of this organization"
        );
      }

      // Set active organization in session
      const token = context.req.cookies?.auth_token;
      if (token) {
        await sessionService.setActiveOrganization(token, id);
      }

      return organizationsService.getOrganizationById(id);
    },

    inviteToOrganization: async (
      _: any,
      {
        organizationId,
        email,
        role,
        teamId,
      }: {
        organizationId: string;
        email: string;
        role: string;
        teamId?: string;
      },
      context: GraphQLContext
    ) => {
      const { userId, organizationId: activeOrgId } =
        checkOrganizationPermissions(context, "manage");

      // Only invite to current organization
      if (organizationId !== activeOrgId) {
        throw new AuthorizationError(
          "You can only invite to the current organization"
        );
      }

      return invitationsService.createInvitation({
        email,
        role,
        organizationId,
        inviterId: userId,
        teamId,
      });
    },

    revokeInvitation: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkOrganizationPermissions(
        context,
        "manage"
      );
      return invitationsService.revokeInvitation(id, organizationId);
    },

    resendInvitation: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      const { organizationId } = checkOrganizationPermissions(
        context,
        "manage"
      );
      return invitationsService.resendInvitation(id, organizationId);
    },

    acceptInvitation: async (
      _: any,
      { token }: { token: string },
      context: GraphQLContext
    ) => {
      const { userId } = checkOrganizationPermissions(context, "view");
      const { organizationId, teamId } =
        await invitationsService.acceptInvitation(token, userId);

      // Switch to the new organization
      const sessionToken = context.req.cookies?.auth_token;
      if (sessionToken) {
        await sessionService.setActiveOrganization(
          sessionToken,
          organizationId
        );

        // If team was specified, set it as active too
        if (teamId) {
          await sessionService.setActiveTeam(sessionToken, teamId);
        }
      }

      return organizationService.getOrganizationById(organizationId);
    },

    updateMember: async (
      _: any,
      {
        id,
        role,
        status,
        teamId,
      }: {
        id: string;
        role?: string;
        status?: string;
        teamId?: string | null;
      },
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "admin");
      return membersService.updateMember(id, { role, status, teamId });
    },

    removeMember: async (
      _: any,
      { userId, organizationId }: { userId: string; organizationId: string },
      context: GraphQLContext
    ) => {
      const { organizationId: activeOrgId } = checkOrganizationPermissions(
        context,
        "admin"
      );

      // Only remove from current organization
      if (organizationId !== activeOrgId) {
        throw new AuthorizationError(
          "You can only remove members from the current organization"
        );
      }

      await membersService.removeUserFromOrganization(userId, organizationId);
      return true;
    },

    transferOwnership: async (
      _: any,
      {
        organizationId,
        newOwnerId,
      }: { organizationId: string; newOwnerId: string },
      context: GraphQLContext
    ) => {
      const { userId, organizationId: activeOrgId } =
        checkOrganizationPermissions(context, "admin");

      // Only transfer current organization
      if (organizationId !== activeOrgId) {
        throw new AuthorizationError(
          "You can only transfer ownership of the current organization"
        );
      }

      await membersService.transferOwnership(
        organizationId,
        newOwnerId,
        userId
      );
      return true;
    },

    createTeam: async (
      _: any,
      {
        name,
        organizationId,
        description,
      }: {
        name: string;
        organizationId: string;
        description?: string;
      },
      context: GraphQLContext
    ) => {
      const { organizationId: activeOrgId } = checkOrganizationPermissions(
        context,
        "manage"
      );

      // Only create in current organization
      if (organizationId !== activeOrgId) {
        throw new AuthorizationError(
          "You can only create teams in the current organization"
        );
      }

      return teamsService.createTeam({
        name,
        organizationId,
        description,
      });
    },

    updateTeam: async (
      _: any,
      {
        id,
        name,
        description,
      }: {
        id: string;
        name?: string;
        description?: string;
      },
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "manage");
      return teamsService.updateTeam(id, { name, description });
    },

    deleteTeam: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "manage");
      await teamsService.deleteTeam(id);
      return true;
    },

    addUserToTeam: async (
      _: any,
      {
        teamId,
        userId,
        organizationId,
      }: { teamId: string; userId: string; organizationId: string },
      context: GraphQLContext
    ) => {
      const { organizationId: activeOrgId } = checkOrganizationPermissions(
        context,
        "manage"
      );

      // Only add to current organization
      if (organizationId !== activeOrgId) {
        throw new AuthorizationError(
          "You can only manage teams in the current organization"
        );
      }

      await teamsService.addUserToTeam(teamId, userId, organizationId);
      return true;
    },

    removeUserFromTeam: async (
      _: any,
      { teamId, userId }: { teamId: string; userId: string },
      context: GraphQLContext
    ) => {
      checkOrganizationPermissions(context, "manage");
      await teamsService.removeUserFromTeam(teamId, userId);
      return true;
    },

    assignPropertiesToTeam: async (
      _: any,
      {
        teamId,
        propertyIds,
        organizationId,
      }: {
        teamId: string;
        propertyIds: string[];
        organizationId: string;
      },
      context: GraphQLContext
    ) => {
      const { organizationId: activeOrgId } = checkOrganizationPermissions(
        context,
        "manage"
      );

      // Only assign in current organization
      if (organizationId !== activeOrgId) {
        throw new AuthorizationError(
          "You can only manage teams in the current organization"
        );
      }

      await teamsService.assignPropertiesToTeam({
        teamId,
        propertyIds,
        organizationId,
      });
      return true;
    },
  },

  // Type resolvers
  Organization: {
    members: async (organization, _args, _context) => {
      return membersService.getOrganizationMembers(organization.id);
    },
    teams: async (organization, _args, _context) => {
      return teamsService.getOrganizationTeams(organization.id);
    },
    owner: async (organization, _args, _context) => {
      if (organization.agentOwner) return organization.agentOwner;

      if (organization.agentOwnerId) {
        const { usersService } = await import(
          "@/domains/users/services/users.service"
        );
        return usersService.getUserById(organization.agentOwnerId);
      }

      return null;
    },
  },

  Team: {
    members: async (team, _args, _context) => {
      return teamsService.getTeamMembers(team.id);
    },
    properties: async (team, _args, _context) => {
      return teamsService.getTeamProperties(team.id);
    },
  },

  Member: {
    user: async (member, _args, _context) => {
      return member.user;
    },
    team: async (member, _args, _context) => {
      if (!member.teamId) return null;
      return member.team || teamsService.getTeamById(member.teamId);
    },
  },

  Invitation: {
    inviter: async (invitation, _args, _context) => {
      return invitation.inviter;
    },
    organization: async (invitation, _args, _context) => {
      return invitation.organization;
    },
  },
};
