import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { securityMiddleware } from '@/lib/security/middleware';

if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production');
}
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret-minimum-32-characters-long' : '')
);

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/test-login', // Test login page
  '/auth/logout',
  '/auth/error',
  '/auth/forgot-password',
  '/api/auth',
  '/api/test-auth', // Test route
  '/api/test', // Test routes for development
  '/display', // Display routes are public for viewing
  '/api/display', // API for displays to fetch their configuration
  '/api/socket', // WebSocket endpoint for displays
  '/api/errors/report', // Error reporting endpoint for displays
];

// Define routes that require specific permissions
const protectedRoutes = {
  '/admin': ['USER_CONTROL'],
  '/content': ['CONTENT_CREATE'],
  '/playlists': ['PLAYLIST_ASSIGN'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Minimal diagnostics; avoid logging sensitive data

  // Apply security middleware first (rate limiting, CSRF, etc.)
  const securityResponse = await securityMiddleware(request);
  if (securityResponse instanceof NextResponse) return securityResponse;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Allow public routes and API health check
  if (isPublicRoute || pathname === '/api/health') {
    console.log('🔍 Middleware - Public route, allowing');
    return NextResponse.next();
  }

  // Get the session token
  const sessionToken = request.cookies.get('session-token')?.value;
  console.log('🔍 Middleware - Session token exists:', !!sessionToken);
  let user = null;
  
  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, secret);
      user = payload;
      console.log('🔍 Middleware - User verified:', user.email);
    } catch (error) {
      console.log('🔍 Middleware - Token verification failed:', error);
      // Invalid token, treat as unauthenticated
    }
  }

  // Redirect to login if no session on protected routes
  if (!user && !isPublicRoute) {
    console.log('🔍 Middleware - No user, redirecting to login');
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check permission requirements for specific routes
  if (user) {
    for (const [route, permissions] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        const userPermissions = (user.permissions as string[]) || [];
        const hasPermission = permissions.some(p => userPermissions.includes(p));
        
        if (!hasPermission) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - fonts (font files)
     * - uploads (public upload directory)
     * - api/files (file serving API)
     * - public folder
     * - API routes that should be public
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts|uploads|public|api/health).*)',
  ],
};
