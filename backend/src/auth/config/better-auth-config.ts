import { betterAuth } from 'better-auth';
import { PrismaAuthAdapter } from './prisma-adapter';
import { UserRole } from '@prisma/client';

// This function will create and return the auth instance
export const createAuthInstance = (prismaAuthAdapter: PrismaAuthAdapter) => {
  return betterAuth({
    // App name
    appName: process.env.APP_NAME || 'Property Management System',

    baseURL: process.env.API_URL || 'http://localhost:3001/api',

    basePath: '/auth',

    secret:
      process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // Auto sign in after registration
      autoSignIn: true,
      // Validate email and password
      validate: async ({ email, password }) => {
        if (!email || !password) {
          return {
            valid: false,
            error: 'Email and password are required',
          };
        }
        return { valid: true };
      },
      // Custom password handlers using bcrypt (handled by our adapter)
      password: {
        // These are implemented in the PrismaAuthAdapter
        hash: async (password) => {
          // Delegate to the adapter
          const hashedUser = await prismaAuthAdapter.createUser({
            email: 'temp@example.com', // Temporary email, never saved
            password,
            name: 'Temporary User',
          });
          return hashedUser.password;
        },
        verify: async ({ hash, password }) => {
          return prismaAuthAdapter.verifyPassword(password, hash);
        },
      },
    },

    // Session configuration
    session: {
      // Database table name
      modelName: 'session',
      // Expiration time in seconds
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      // Update age in seconds
      updateAge: 60 * 60 * 24, // 1 day
      // Fresh age for sensitive operations
      freshAge: 60 * 60, // 1 hour
    },

    // User configuration
    user: {
      // Database table name
      modelName: 'user',
      // Additional user fields
      additionalFields: {
        role: {
          type: 'string',
          default: UserRole.LANDLORD,
        },
        phone: {
          type: 'string',
          optional: true,
        },
        profileImage: {
          type: 'string',
          optional: true,
        },
        address: {
          type: 'string',
          optional: true,
        },
        city: {
          type: 'string',
          optional: true,
        },
        country: {
          type: 'string',
          optional: true,
        },
        bio: {
          type: 'string',
          optional: true,
        },
      },
      // User deletion configuration
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          // Add any cleanup logic here
          console.log(`User ${user.id} is being deleted`);
        },
      },
    },

    // Verification configuration
    verification: {
      modelName: 'verification',
    },

    // Advanced options
    advanced: {
      // Use secure cookies in production
      useSecureCookies: process.env.NODE_ENV === 'production',

      // Default cookie attributes
      defaultCookieAttributes: {
        sameSite: 'lax', // Use 'none' in production with HTTPS
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },

      // Cookie prefix
      cookiePrefix: 'property-app',
    },

    // Trusted origins for CSRF protection
    trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],

    // Rate limiting configuration
    rateLimit: {
      enabled: process.env.NODE_ENV === 'production',
      window: 60, // 1 minute
      max: 100, // 100 requests per minute
      customRules: {
        // More strict rate limit for auth routes
        '/auth/sign-in': { window: 60, max: 10 }, // 10 attempts per minute
        '/auth/sign-up': { window: 60, max: 5 }, // 5 attempts per minute
      },
    },

    // Hooks for authentication events
    hooks: {
      onSignUp: async ({ user, data }) => {
        // You can modify the user object or perform additional actions
        console.log(`User signed up: ${user.email}`);
        return { user };
      },

      onSignIn: async ({ user }) => {
        // Custom logic on sign in (logging, etc.)
        console.log(`User signed in: ${user.email}`);
        return { user };
      },
    },

    // Database hooks
    databaseHooks: {
      // User hooks
      user: {
        create: {
          before: async (user, context) => {
            // You can modify the user data before it's created
            console.log(`Creating user: ${user.email}`);
            return;
          },
          after: async (user, context) => {
            // You can perform actions after a user is created
            console.log(`User created: ${user.id}`);
          },
        },
        update: {
          before: async (userData, context) => {
            // You can modify user update data
            console.log(`Updating user: ${userData.id}`);
            return;
          },
        },
      },
      // Session hooks
      session: {
        create: {
          after: async (session, context) => {
            // You can perform actions after a session is created
            console.log(`Session created for user: ${session.userId}`);
          },
        },
      },
    },

    // Error handling
    onAPIError: {
      throw: false, // Don't throw errors in the API
      onError: (error, ctx) => {
        console.error('Auth API error:', error);
      },
    },
  });
};

// Export types for better TypeScript support
export type Auth = ReturnType<typeof createAuthInstance>;
