import { organizationsService } from "@/domains/organizations/services";
import { db } from "@/infrastructure/database";
import { emailService } from "@/infrastructure/email/email.service";
import { AUTH_CONFIG, SERVER_CONFIG } from "@/shared/constants/enviroment";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI, organization } from "better-auth/plugins";
import { addMonths } from "date-fns";
import { ac, roles } from "../permissions";

const authOptions: BetterAuthOptions = {
  appName: "Property Management System",
  baseURL: SERVER_CONFIG.BASE_URL,
  basePath: "/api/auth",
  secret: AUTH_CONFIG.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: "users",
      account: "accounts",
      session: "sessions",
      organization: "organizations",
      team: "teams",
      member: "members",
      invitation: "invitations",
      verification: "verifications",
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token }) => {
      await emailService.sendResetPasswordEmail({ user, url, token });
    },
  },

  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      role: { type: "string", required: true },
      isActive: { type: "boolean", required: true, defaultValue: true },
      emailVerified: { type: "boolean", required: true, defaultValue: false },
      image: { type: "string", required: false },
      address: { type: "string", required: false },
      city: { type: "string", required: false },
      country: { type: "string", required: false },
      bio: { type: "string", required: false },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
        await emailService.sendChangeEmailVerification({
          user,
          newEmail,
          url,
          token,
        });
      },
    },
  },

  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 1 day
  },

  plugins: [
    organization({
      ac,
      roles: {
        owner: roles.owner, // For agent_owner
        admin: roles.admin, // For admin staff
        member: roles.propertyOwner, // For property owners
        caretaker: roles.caretaker, // For caretakers
        tenant: roles.tenantUser, // For tenants
      },

      // Organization creation hooks
      organizationCreation: {
        disabled: false,
        beforeCreate: async ({ organization, user }) => {
          // Calculate trial expiration date (1 month from now)
          const trialExpiresAt = addMonths(new Date(), 1);

          return {
            data: {
              ...organization,
              agentOwnerId: user.id,
              trialStatus: "active",
              trialStartedAt: new Date(),
              trialExpiresAt,
              subscriptionStatus: "trialing",
              maxProperties: 5, // Trial limits
              maxUsers: 3,
            },
          };
        },
        afterCreate: async ({ organization, member, user }) => {
          try {
            // Send welcome email
            await emailService.sendTrialWelcomeEmail(
              user.email,
              user.name || user.email,
              organization.name,
              organization.trialExpiresAt
            );
          } catch (error) {
            console.error("Error in organization afterCreate hook:", error);
          }
        },
      },

      async sendInvitationEmail(data) {
        await emailService.sendOrganizationInvitation({
          email: data.email,
          inviter: data.inviter,
          organization: { name: data.organization.name },
          id: data.id,
        });
      },

      teams: {
        enabled: true,
        maximumTeams: async ({ organizationId }) => {
          // Get organization subscription to determine team limit
          const organization =
            await organizationsService.getOrganizationById(organizationId);

          // Default to 3 teams for trial/basic, more for paid plans
          if (!organization) return 3;

          switch (organization.subscriptionPlan) {
            case "premium":
              return 20;
            case "standard":
              return 10;
            default:
              return 3;
          }
        },
      },
    }),

    // Admin plugin for user/org management
    admin({
      adminRoles: ["admin", "agent_owner"],
      defaultRole: "agent_staff",
    }),
    openAPI(),
  ],

  // // Error handling
  // onAPIError: {
  //   throw: true,
  //   onError: (error) => {
  //     console.error("Auth error:", error);
  //   },
  // },
};

// Export the auth instance
export const auth = betterAuth(authOptions);

// Helper function to get user's active organization
export async function getActiveOrganization(userId: string) {
  // Check if user has organizations
  const userOrgs = await auth.api.orgo({ userId });

  if (userOrgs.length === 0) {
    throw new Error("User has no organizations");
  }

  // Return the first organization or handle active selection logic
  return userOrgs[0];
}
