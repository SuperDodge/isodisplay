'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't apply layout on public display pages or auth pages
  const isPublicPage = pathname?.startsWith('/display/') || pathname?.startsWith('/auth/');

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-brand-gray-900">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}