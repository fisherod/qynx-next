// =================================
// 🛡️ Next.js Middleware for Security & Logging
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Protect /user/* routes – require any authenticated user
  if (pathname.startsWith("/user")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    if (!token) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Protect /admin/* routes – require admin role (but allow /admin login page)
  if (pathname.startsWith("/admin/")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    if (!token || token.role !== "admin") {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  const response = NextResponse.next();

  // Add security headers
  addSecurityHeaders(response);

  // Log API requests (simplified)
  const duration = Date.now() - startTime;

  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Permissions Policy
  const permissionsPolicy = [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=(self)",
    "usb=()",
    "magnetometer=()",
    "accelerometer=()",
    "gyroscope=()"
  ].join(", ");

  response.headers.set("Permissions-Policy", permissionsPolicy);

  // Remove powered by header
  response.headers.delete("X-Powered-By");
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|public|icons|manifest.json|sw.js|workbox-).*)"
  ]
};
