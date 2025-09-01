import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { Permission } from '@/generated/prisma';

if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production');
}
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret-minimum-32-characters-long' : '')
);

export interface User {
  id: string;
  email: string;
  username: string;
  permissions: Permission[];
}

/**
 * Get the current session on the server
 */
export async function getCurrentSession() {
  try {
    const token = (await cookies()).get('session-token')?.value;
    
    if (!token) {
      return null;
    }
    
    const { payload } = await jwtVerify(token, secret);
    
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        username: payload.username as string,
        permissions: (payload.permissions as Permission[]) || [],
      }
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return !!session;
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.permissions.includes(permission);
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]) {
  const user = await getCurrentUser();
  if (!user) return false;
  return permissions.some(p => user.permissions.includes(p));
}

/**
 * Check if the current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]) {
  const user = await getCurrentUser();
  if (!user) return false;
  return permissions.every(p => user.permissions.includes(p));
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/login');
  }
  return session;
}

/**
 * Require specific permission - redirects to unauthorized if lacking permission
 */
export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  if (!session.user.permissions.includes(permission)) {
    redirect('/unauthorized');
  }
  return session;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const session = await requireAuth();
  if (!permissions.some(p => session.user.permissions.includes(p))) {
    redirect('/unauthorized');
  }
  return session;
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(permissions: Permission[]) {
  const session = await requireAuth();
  if (!permissions.every(p => session.user.permissions.includes(p))) {
    redirect('/unauthorized');
  }
  return session;
}
