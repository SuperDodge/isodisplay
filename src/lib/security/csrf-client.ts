const CSRF_HEADER_NAME = 'x-csrf-token';

// Hook to include CSRF token in fetch requests
export function getCSRFHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  // Get token from meta tag or cookie
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  const token = metaTag?.getAttribute('content');
  
  if (token) {
    return {
      [CSRF_HEADER_NAME]: token,
    };
  }
  
  return {};
}

// Client-side helper to make authenticated requests
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfHeaders = getCSRFHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...csrfHeaders,
    },
    credentials: 'same-origin',
  });
}