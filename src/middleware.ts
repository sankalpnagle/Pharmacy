import { NextResponse } from "next/server";
import authConfig from "./auth.config";
import NextAuth from "next-auth";
import {
  authRoutes,
  apiAuthPrefix,
  publicRoutes,
  protectedApiRoutes,
  DEFAULT_LOGIN_REDIRECT,
} from "./routes";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Handle CORS for API routes first
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();

    // Set CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle large payloads for specific routes
    if (pathname.includes("/api/products/bulk-image-upload")) {
      response.headers.set("Content-Length", "10485760"); // 10MB
    }

    return response;
  }

  // Get authentication status
  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Special handling for verify-mail route
  if (pathname === "/verify-mail" && nextUrl.searchParams.has("token")) {
    return NextResponse.next();
  }

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(pathname);

  // Check public routes with wildcard support
  const isPublicRoute = publicRoutes.some((route) => {
    // Handle routes with query params
    if (route.includes("?")) {
      const [basePath, queryParam] = route.split("?");
      if (
        pathname === basePath &&
        nextUrl.searchParams.has(queryParam.split("=")[0])
      ) {
        return true;
      }
    }
    // Handle dynamic routes
    const pattern = "^" + route.replace(/:[^/]+/g, "[^/]+") + "$";
    const routeRegex = new RegExp(pattern);
    return routeRegex.test(pathname);
  });

  // Check protected API routes
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 1. Allow API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 2. Redirect if trying to access auth route while logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // 3. Protect API routes
  if (isProtectedApiRoute && !isLoggedIn) {
    // Redirect to home page instead of returning 401
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }
  // 4. Redirect to login if trying to access protected route while logged out
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    let callbackUrl = pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/`, nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - .*\\..* (files with extensions)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)",
  ],
};
