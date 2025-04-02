"use client";
// lib/auth-sync.ts

import { useEffect } from 'react';
import Cookies from 'js-cookie'; // Make sure to install: npm install js-cookie @types/js-cookie

/**
 * Client component to synchronize authentication tokens stored in localStorage
 * with cookies. This allows the Next.js middleware (running server-side during navigation)
 * to access authentication status, even though the primary token storage for
 * client-side operations (like API calls via apiClient) is localStorage.
 */
export function AuthTokenSync() {
  useEffect(() => {
    // Function to read tokens from localStorage and write them to cookies
    const syncTokensToCookies = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken'); // Also sync refresh token if needed by backend logic accessed via SSR

      const cookieOptions: Cookies.CookieAttributes = {
        // Set secure: true in production for HTTPS only
        secure: process.env.NODE_ENV === 'production',
        // Recommended SameSite attribute for security
        sameSite: 'strict', // Or 'lax' depending on your needs
        // Path defaults to '/' which is usually fine
      };

      if (accessToken) {
        // Set the access token cookie. Expiry here is mainly for the browser,
        // actual validation happens based on JWT expiry checked by NestJS.
        // Setting a session cookie (no expires) or a short expiry is common.
        Cookies.set('accessToken', accessToken, { ...cookieOptions /* expires: 1/24 // e.g., 1 hour */ });
        // console.log('Synced accessToken to cookie.');
      } else {
        // If token is removed from localStorage, remove the cookie too
        Cookies.remove('accessToken', { ...cookieOptions });
        // console.log('Removed accessToken cookie.');
      }

      // Optionally sync refresh token if needed elsewhere (less common for middleware checks)
      if (refreshToken) {
        Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 }); // Longer expiry for refresh token
      } else {
        Cookies.remove('refreshToken', { ...cookieOptions });
      }
    };

    // 1. Run sync immediately on component mount
    syncTokensToCookies();

    // 2. Set up a listener for localStorage changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the changed key relates to our tokens
      if (event.key === 'accessToken' || event.key === 'refreshToken') {
        // console.log('Storage changed, syncing tokens to cookies...');
        syncTokensToCookies();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 3. Clean up the listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // This component does not render any UI
  return null;
}