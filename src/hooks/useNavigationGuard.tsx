'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseNavigationGuardProps {
  hasUnsavedChanges: boolean;
  onNavigationAttempt: (destination: string) => void;
}

export function useNavigationGuard({ 
  hasUnsavedChanges, 
  onNavigationAttempt 
}: UseNavigationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        
        // Only intercept internal navigation
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          e.preventDefault();
          e.stopPropagation();
          onNavigationAttempt(url.pathname);
        }
      }
    };

    // Intercept browser back/forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        // Push current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        onNavigationAttempt(window.location.pathname);
      }
    };

    // Add event listeners
    document.addEventListener('click', handleClick, true); // Use capture phase
    window.addEventListener('popstate', handlePopState);
    
    // Push state to enable popstate handling
    window.history.pushState(null, '', window.location.href);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, pathname, onNavigationAttempt]);
}