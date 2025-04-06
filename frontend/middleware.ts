import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

// Define which routes require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/properties",
  "/tenants",
  "/payments",
  "/maintenance",
  "/reports",
  "/viewings",
  "/leads",
];

// Define authentication routes
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Check if the route is an authentication route
  const isAuthRoute = AUTH_ROUTES.some((prefix) => pathname.startsWith(prefix));

  // Use Better Auth's getSessionCookie helper to check for session
  // This is the recommended approach from Better Auth docs
  const sessionCookie = getSessionCookie(request, {
    // These should match your auth config in auth.ts/auth-config.ts
    cookieName: "session_token", // Adjust this to match your Better Auth config
    cookiePrefix: "better-auth", // Adjust this to match your Better Auth config
  });

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("return_to", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth routes with a session, redirect to dashboard or return_to
  if (isAuthRoute && sessionCookie) {
    const returnTo = request.nextUrl.searchParams.get("return_to");
    if (returnTo && returnTo.startsWith("/")) {
      return NextResponse.redirect(new URL(returnTo, request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configuration: Apply middleware to specified paths
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|static|images|.*\\.png$|.*\\.jpg$).*)",
    "/dashboard/:path*",
    "/properties/:path*",
    "/tenants/:path*",
    "/payments/:path*",
    "/maintenance/:path*",
    "/reports/:path*",
    "/viewings/:path*",
    "/leads/:path*",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
  ],
};
