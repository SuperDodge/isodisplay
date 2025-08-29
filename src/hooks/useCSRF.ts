'use client';

import { useEffect, useState } from 'react';
import { getCSRFHeaders } from '@/lib/security/csrf';

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  useEffect(() => {
    // Get CSRF token from meta tag or fetch it
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    const token = metaTag?.getAttribute('content');
    
    if (token) {
      setCSRFToken(token);
    } else {
      // Fetch CSRF token from server
      fetch('/api/auth/csrf')
        .then(res => res.json())
        .then(data => {
          if (data.csrfToken) {
            setCSRFToken(data.csrfToken);
            // Add meta tag for future use
            const meta = document.createElement('meta');
            meta.name = 'csrf-token';
            meta.content = data.csrfToken;
            document.head.appendChild(meta);
          }
        })
        .catch(console.error);
    }
  }, []);

  const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const csrfHeaders = getCSRFHeaders();
    
    return fetch(url, {
      ...options,
      headers: {
        ...csrfHeaders,
        'Content-Type': 'application/json',
        ...options.headers, // Allow options to override default Content-Type if needed
      },
      credentials: 'same-origin',
    });
  };

  return { csrfToken, secureFetch };
}