"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Base URL for API requests - should match what's in auth.ts
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // Define the specific endpoints
  endpoints: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    signOut: '/auth/logout',
    refresh: '/auth/refresh',
    getSession: '/auth/me',
    
    // App-specific endpoints
    updateProfile: '/users/profile',
    getUserSubscription: '/subscriptions/current',
    getSubscriptionDashboardUrl: '/subscriptions/dashboard-url',
  },
  
  // Storage configuration
  storage: {
    accessToken: {
      name: 'accessToken',
    },
    refreshToken: {
      name: 'refreshToken',
    },
  },
  
  // Options configuration
  options: {
    redirects: {
      signIn: '/sign-in',
      signUp: '/sign-up',
      afterSignIn: '/dashboard',
      afterSignOut: '/',
    },
    extractors: {
      accessToken: (response: any) => response.accessToken,
      refreshToken: (response: any) => response.refreshToken,
      user: (response: any) => ({
        id: response.id,
        name: response.name,
        email: response.email,
      }),
    },
  },
});

// Export hooks from better-auth
export const {
  useAuth,
  useUser,
  useSignIn,
  useSignUp,
  useSignOut,
  useRefreshToken,
  useIsAuthenticated,
  useFetch,
  AuthProvider,
} = authClient;