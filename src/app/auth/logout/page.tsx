'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Clear session and redirect
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        router.push('/auth/login');
      })
      .catch(() => {
        router.push('/auth/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">Signing out...</h1>
        <p className="text-white/70">Please wait while we log you out.</p>
      </div>
    </div>
  );
}