// lib/better-auth.ts
import { betterAuth } from 'better-auth'  // Assuming this is the correct import

// API Base URL for your NestJS backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Initialize better-auth with configuration
export const {
  useAuth,
  useUser,
  useSignIn,
  useSignUp,
  useSignOut,
  useRefreshToken,
  useIsAuthenticated,
  useFetch,
  AuthProvider
} = betterAuth({
  baseURL: API_URL,
  endpoints: {
    // Auth endpoints
    signIn: '/auth/login',
    signUp: '/auth/register',
    signOut: '/auth/logout',
    refresh: '/auth/refresh',
    user: '/auth/me',
    
    // Additional endpoints specific to your application
    updateProfile: '/users/profile',
    getSubscription: '/subscriptions/current',
    getSubscriptionDashboardUrl: '/subscriptions/dashboard-url',
  },
  storage: {
    // Configure token storage
    accessToken: {
      name: 'accessToken',
      maxAge: 60 * 60, // 1 hour
    },
    refreshToken: {
      name: 'refreshToken',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },
  // Customize auth behaviors
  options: {
    redirects: {
      signIn: '/sign-in',
      signUp: '/sign-up',
      afterSignIn: '/dashboard',
      afterSignOut: '/',
    },
    // Custom token extraction from API responses
    extractors: {
      accessToken: (response: { accessToken: string }) => response.accessToken,
      refreshToken: (response: { refreshToken: string }) => response.refreshToken,
      user: (response: { id: string; name: string; email: string }) => ({
        id: response.id,
        name: response.name,
        email: response.email,
      }),
    },
  },
})