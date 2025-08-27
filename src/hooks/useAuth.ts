'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Permission } from '@/generated/prisma';

interface User {
  id: string;
  email: string;
  username: string;
  permissions: Permission[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        });
      } else if (response.status === 401) {
        setAuthState({
          user: null,
          loading: false,
          error: 'Not authenticated',
        });
        router.push('/auth/login');
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: 'Failed to check authentication',
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        error: 'Network error',
      });
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    checkAuth,
    logout,
  };
}