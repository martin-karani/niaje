// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Function to check if a route is protected
const isProtectedRoute = (pathname: string): boolean => {
  return pathname.startsWith('/dashboard');
};

// Function to check if route is authentication related
const isAuthRoute = (pathname: string): boolean => {
  return pathname === '/sign-in' || pathname === '/sign-up';
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get access token from cookies if available
  // Note: In our implementation, we're using localStorage for tokens in the client
  // but for SSR/middleware, we need to use cookies
  const accessToken = request.cookies.get('accessToken')?.value;

  // Check if we're trying to access a protected route without being authenticated
  if (isProtectedRoute(pathname) && !accessToken) {
    // Redirect to login page with a return_to parameter
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('return_to', pathname);
    return NextResponse.redirect(url);
  }

  // Check if we're trying to access auth pages while already authenticated
  if (isAuthRoute(pathname) && accessToken) {
    // Redirect to dashboard if already logged in
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Match all routes except for static files, api, favicon, etc.
    '/((?!api|_next/static|_next/image|favicon.ico|static).*)',
  ],
};