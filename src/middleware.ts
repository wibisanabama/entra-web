import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedPrefixes = [
  '/dashboard',
  '/my-tickets',
  '/profile',
  '/cashless',
];

// Auth routes where authenticated users should be redirected away from
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Helper function to decode and check token payload and expiration in Edge runtime
function decodeTokenPayload(token?: string): { role?: string; exp?: number } | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch {
    return null;
  }
}

function isTokenValid(token?: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload) return false;
  if (!payload.exp) return true;
  return payload.exp * 1000 > Date.now();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('entra_token')?.value;
  const refreshToken = request.cookies.get('entra_refresh')?.value;
  const hasValidToken = isTokenValid(token);
  const hasRefreshToken = typeof refreshToken === 'string' && refreshToken.trim().length > 0;
  const payload = decodeTokenPayload(token);
  const userRole = payload?.role;

  // 1. Check if user is accessing a protected route without any valid token or refresh token
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute && !hasValidToken && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Guard /dashboard from non-organizers and non-admins
  if (pathname.startsWith('/dashboard') && userRole && userRole !== 'organizer' && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Guard /dashboard/admin from non-admins
  if (pathname.startsWith('/dashboard/admin') && userRole && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Check if user is accessing an auth route with an active valid token or refresh session
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  if (isAuthRoute && (hasValidToken || hasRefreshToken)) {
    const targetUrl = (userRole === 'organizer' || userRole === 'admin') ? '/dashboard' : '/';
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
