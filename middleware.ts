// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes require authentication
const PROTECTED_ROUTES = ['/dashboard']; // Add any other protected route prefixes

// Define authentication routes (login, signup)
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  // Check if the route is an authentication route
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Attempt to get the access token cookie (set by AuthTokenSync)
  const accessTokenCookie = request.cookies.get('accessToken'); // Use the same name as in AuthTokenSync

  // --- Protection Logic ---

  // 1. If accessing a protected route AND no access token cookie exists:
  //    Redirect to the login page, preserving the intended destination.
  if (isProtectedRoute && !accessTokenCookie) {
    const loginUrl = new URL('/sign-in', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Pass intended path
    console.log(`Middleware: No token for protected route ${pathname}, redirecting to login.`);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If accessing an auth route (login/signup) AND an access token cookie *does* exist:
  //    Redirect authenticated users away from login/signup pages to the dashboard.
  if (isAuthRoute && accessTokenCookie) {
    console.log(`Middleware: Authenticated user accessing ${pathname}, redirecting to dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- Allow Request ---
  // If none of the above conditions are met, allow the request to proceed.
  return NextResponse.next();
}

// Configuration: Apply middleware to specified paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static (custom static assets folder if you have one)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|static).*)',
    // Include specific pages if needed, but the negative lookahead above is often sufficient
    // '/dashboard/:path*',
    // '/settings',
    // '/sign-in',
    // '/sign-up',
  ],
};