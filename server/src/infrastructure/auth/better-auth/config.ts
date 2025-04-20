import { emailService } from "@/infrastructure/email/email.service";
import { betterAuth } from "better-auth";
import { admin, organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
} from "better-auth/plugins/organization/access";
import { redisStorage } from "better-auth/storage";

// Define custom permissions for our property management system
const statements = {
  ...defaultStatements,
  property: ["create", "read", "update", "delete", "assign"],
  tenant: ["create", "read", "update", "delete", "contact"],
  lease: ["create", "read", "update", "delete", "renew", "terminate"],
  payment: ["create", "read", "update", "delete", "process", "refund"],
  maintenance: ["create", "read", "update", "delete", "assign", "complete"],
  report: ["create", "read", "export"],
  settings: ["read", "update"],
} as const;

// Create access control
const ac = createAccessControl(statements);

// Define roles with specific permissions
const owner = ac.newRole({
  ...adminAc.statements, // Include all admin permissions for organization management
  property: ["create", "read", "update", "delete", "assign"],
  tenant: ["create", "read", "update", "delete", "contact"],
  lease: ["create", "read", "update", "delete", "renew", "terminate"],
  payment: ["create", "read", "update", "delete", "process", "refund"],
  maintenance: ["create", "read", "update", "delete", "assign", "complete"],
  report: ["create", "read", "export"],
  settings: ["read", "update"],
});

const manager = ac.newRole({
  organization: ["update"],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
  property: ["create", "read", "update", "assign"],
  tenant: ["create", "read", "update", "contact"],
  lease: ["create", "read", "update", "renew"],
  payment: ["create", "read", "process"],
  maintenance: ["create", "read", "update", "assign", "complete"],
  report: ["create", "read", "export"],
  settings: ["read"],
});

const agent = ac.newRole({
  property: ["read", "update"],
  tenant: ["read", "contact"],
  lease: ["read", "update"],
  payment: ["read", "create"],
  maintenance: ["create", "read", "update", "complete"],
  report: ["read"],
});

const propertyOwner = ac.newRole({
  property: ["read"],
  tenant: ["read"],
  lease: ["read"],
  payment: ["read"],
  maintenance: ["read", "create"],
  report: ["read"],
});

const caretaker = ac.newRole({
  property: ["read"],
  tenant: ["read", "contact"],
  maintenance: ["read", "update", "create", "complete"],
});

const tenant = ac.newRole({
  lease: ["read"],
  payment: ["read", "create"],
  maintenance: ["read", "create"],
});

// Create Better Auth instance with EmailService integration
export const auth = betterAuth({
  appName: process.env.APP_NAME || "Property Management System",
  baseURL: process.env.BASE_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.AUTH_SECRET,

  // Use Redis for session storage if available
  secondaryStorage: process.env.REDIS_URL
    ? redisStorage({ url: process.env.REDIS_URL })
    : undefined,

  // Email verification settings
  emailVerification: {
    sendVerificationEmail:
      emailService.sendVerificationEmail.bind(emailService),
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 24 * 60 * 60, // 24 hours
    onEmailVerification: async (user) => {
      console.log(`User ${user.email} verified their email`);
    },
  },

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    sendResetPassword: emailService.sendResetPasswordEmail.bind(emailService),
    resetPasswordTokenExpiresIn: 1 * 60 * 60, // 1 hour
    autoSignIn: true,
  },

  // Configure user model
  user: {
    additionalFields: {
      subscriptionTier: {
        type: "string",
        nullable: true,
      },
      phoneNumber: {
        type: "string",
        nullable: true,
      },
      profileImage: {
        type: "string",
        nullable: true,
      },
    },

    // Enable email change with verification
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification:
        emailService.sendChangeEmailVerification.bind(emailService),
    },

    // Enable user deletion with verification
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification:
        emailService.sendDeleteAccountVerification.bind(emailService),
      beforeDelete: async (user) => {
        console.log(`Preparing to delete user ${user.email}`);
        // Add your custom logic for data cleanup before deletion
      },
      afterDelete: async (user) => {
        console.log(`User ${user.email} has been deleted`);
        // Add your custom logic for post-deletion cleanup
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 1 day
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    freshAge: 1 * 24 * 60 * 60, // 1 day for sensitive operations
  },

  // Organization plugin configuration
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin: manager, // Map 'admin' role to our 'manager' role
        member: agent,
        propertyOwner,
        caretaker,
        tenant,
      },

      // Email invitation - using our EmailService
      sendInvitationEmail:
        emailService.sendOrganizationInvitation.bind(emailService),

      // Organization creation hooks
      organizationCreation: {
        beforeCreate: async ({ organization, user }) => {
          console.log(
            `User ${user.email} is creating organization ${organization.name}`
          );

          return {
            data: {
              ...organization,
              metadata: {
                subscriptionTier: "trial",
                trialEndsAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
                createdBy: user.id,
              },
            },
          };
        },
        afterCreate: async ({ organization, member, user }) => {
          console.log(
            `Organization ${organization.name} created by ${user.email}`
          );

          // Send welcome email to new organization creator
          try {
            const trialEndDate = new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ); // 30 days from now
            await emailService.sendTrialWelcomeEmail(
              user.email,
              user.name || user.email,
              organization.name,
              trialEndDate
            );
          } catch (error) {
            console.error("Error sending welcome email:", error);
          }

          // Create initial default team for the organization
          // This would be handled by a service in your application
        },
      },

      // Team configuration
      teams: {
        enabled: true,
        maximumTeams: async ({ organizationId }) => {
          // Determine maximum teams based on subscription tier
          // You would implement this based on your subscription model
          return 10; // Default value, should be determined by subscription tier
        },
        allowRemovingAllTeams: false,
      },

      invitationExpiresIn: 7 * 24 * 60 * 60, // 7 days
      cancelPendingInvitationsOnReInvite: true,
    }),

    // Admin plugin for user management
    admin({
      ac,
      roles: {
        admin: owner, // Map 'admin' role to our 'owner' role
        user: agent, // Map 'user' role to our 'agent' role
      },
      defaultRole: "agent",
      adminRoles: ["owner", "manager"],
      impersonationSessionDuration: 1 * 60 * 60, // 1 hour
    }),
  ],

  // Error handling
  onAPIError: {
    throw: true,
    onError: (error, ctx) => {
      console.error("Auth error:", error);
    },
    errorURL: "/auth/error",
  },

  // Advanced options
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      // We'll use UUID generation for IDs
      generateId: ({ model }) => {
        // Generate a UUID
        return crypto.randomUUID();
      },
    },
  },
});

export default auth;
