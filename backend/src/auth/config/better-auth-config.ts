import { betterAuth, BetterAuthOptions } from 'better-auth';
import { PrismaAuthAdapter } from './prisma-adapter'; // Assuming adapter is correctly imported

// Define this type based on your actual adapter structure if needed elsewhere
export type AuthInstance = ReturnType<typeof betterAuth>;

// You might need to get the secret and URL from environment variables
const authSecret = process.env.AUTH_SECRET || 'better-auth-secret-123456789'; // Replace with your actual secret handling
const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Adjust as needed

export function createAuthInstance(
  prismaAuthAdapter: PrismaAuthAdapter,
): AuthInstance {
  const authOptions: BetterAuthOptions = {
    // Basic Info
    appName: 'Niaje Tech Platform',
    baseURL: baseUrl,
    basePath: '/api/auth', // Default, ensure it matches middleware logic
    secret: authSecret,

    // --- Add Database Configuration ---
    // This tells better-auth how to interpret your schema, even with an adapter
    database: {
      dialect: 'postgres', // Match your database
      type: 'postgres', // Match your database
      // casing: 'camel', // Optional: if your Prisma schema uses camelCase
      // You might need to specify model names if they differ from defaults
      // modelNames: {
      //   user: 'users', // Matches your @@map("users")
      //   session: 'sessions', // Matches your @@map("sessions")
      //   account: 'accounts', // If you have an accounts table
      //   verification: 'verifications', // If you use email verification/tokens stored in DB
      // },
    },

    // Adapter (You are providing this externally via injection, which is fine)
    // The 'adapter' property here is usually for direct instantiation,
    // keep it commented out if you inject PrismaAuthAdapter elsewhere like you do.
    adapter: prismaAuthAdapter,

    // Email & Password Provider
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set as needed
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      sendResetPassword: async ({ user, url, token }) => {
        // Implement your email sending logic here
        console.log(
          `Sending reset password email to ${user.email} with token ${token} and url ${url}`,
        );
        // Example: await emailService.sendPasswordReset(user.email, url);
      },
      resetPasswordTokenExpiresIn: 3600, // 1 hour
      // Remove the unsupported 'validate' property
      // Custom password hashing/verification can be provided if needed,
      // otherwise better-auth uses defaults or expects the adapter to handle it.
      // password: {
      //   hash: async (password) => prismaAuthAdapter.hashPassword(password), // Example if adapter has hash method
      //   verify: async ({ hash, password }) => prismaAuthAdapter.verifyPassword(password, hash), // Use adapter's verify
      // }
    },

    // User Configuration
    user: {
      modelName: 'users', // Matches your Prisma @@map
      fields: {
        // Map fields if your Prisma model uses different names than better-auth expects
        // email: 'email', // default mapping
        // name: 'name', // default mapping
        // id: 'id', // default mapping
      },
      additionalFields: {
        phone: { type: 'string', nullable: true }, // Use nullable instead of optional
        role: { type: 'string', nullable: false }, // Default handled by Prisma schema, ensure nullable is false if required
        isActive: { type: 'boolean', nullable: false }, // Default handled by Prisma schema
        emailVerified: { type: 'boolean', nullable: false }, // Default handled by Prisma schema
        profileImage: { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        city: { type: 'string', nullable: true },
        country: { type: 'string', nullable: true },
        bio: { type: 'string', nullable: true },
      },
      // Email change and user deletion configs (adjust as needed)
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
    },

    // Session Configuration
    session: {
      modelName: 'sessions', // Matches your Prisma @@map
      fields: {
        // userId: 'userId', // default mapping
      },
      expiresIn: 604800, // 7 days
      updateAge: 86400, // 1 day
      storeSessionInDatabase: true, // Important if using DB for sessions
      preserveSessionInDatabase: false, // Delete expired sessions from DB
      cookieCache: {
        enabled: true,
        maxAge: 300, // 5 minutes
      },
    },

    // Verification (Tokens) Configuration
    verification: {
      modelName: 'tokens', // Matches your Prisma @@map for tokens
      fields: {
        //  userId: 'userId', // default mapping
      },
      disableCleanup: false, // Clean up expired tokens
    },

    // Advanced Settings
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production', // Use secure cookies in prod
      // Add trusted origins if your frontend is on a different domain
      // trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    },

    // Hooks - Commenting out unsupported hooks
    hooks: {
      // Use database hooks for specific actions like post-signup
      // onSignUp: async ({ user, data }) => {
      //   console.log(`User signed up: ${user.email}`);
      //   // Perform actions after signup, e.g., create profile
      // },
      // onSignIn: async ({ user }) => {
      //   console.log(`User signed in: ${user.email}`);
      //   // Perform actions after signin
      // },
    },
    // Database Hooks (if needed for specific actions before/after DB operations)
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            console.log(`User created via better-auth hook: ${user.email}`);
            // Example: Initialize user profile or send welcome email
          },
        },
      },
    },

    // Error Handling
    onAPIError: {
      throw: false, // Don't throw, let NestJS handle errors or handle in onError
      onError: (error, ctx) => {
        console.error(`Better Auth API Error (${ctx?.path}):`, error.message);
        // Add custom logging or error reporting
      },
      errorURL: '/auth/error', // Redirect URL on error (client-side)
    },
  };

  // Set the adapter on the options AFTER defining them
  // This way, the database config is included for better-auth's internal logic,
  // and the adapter handles the actual operations.
  authOptions.adapter = prismaAuthAdapter;

  return betterAuth(authOptions);
}
