import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';

const prisma = new PrismaClient();
export const auth = betterAuth({
  plugins: [openAPI()],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: process.env.API_URL || 'http://localhost:3001/api',
  basePath: '/api/auth',
  secret:
    process.env.AUTH_SECRET || 'your-super-secret-key-change-in-production',
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'learn-react-login-system',
  },
  trustedOrigins: process.env.ORIGIN?.split(',') || [],
  appName: process.env.APP_NAME || 'Property Management System',
  emailAndPassword: { enabled: true, autoSignIn: true },
});
