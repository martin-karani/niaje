"use client";
// lib/auth-sync.ts

import { useEffect } from 'react';
import Cookies from 'js-cookie';

/**
 * This component syncs localStorage auth tokens with cookies for SSR/middleware
 * Since our auth uses localStorage for client-side auth, but middleware 
 * needs cookies to check auth status
 */
export function AuthTokenSync() {
  useEffect(() => {
    // Function to sync tokens from localStorage to cookies
    const syncTokens = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken) {
        // Set cookie with the same expiration as the token would have (example: 1 day)
        Cookies.set('accessToken', accessToken, { 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: 1 // 1 day
        });
      } else {
        Cookies.remove('accessToken');
      }
      
      if (refreshToken) {
        // Set longer expiration for refresh token (example: 30 days)
        Cookies.set('refreshToken', refreshToken, { 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: 30 // 30 days
        });
      } else {
        Cookies.remove('refreshToken');
      }
    };

    // Run on mount
    syncTokens();

    // Listen for storage events (in case another tab changes auth)
    const handleStorageChange = () => {
      syncTokens();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}