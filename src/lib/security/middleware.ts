import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitConfigs } from './rate-limit';
import { validateCSRFToken } from './csrf-server';

export async function securityMiddleware(request: NextRequest): Promise<NextResponse | void> {
  const { pathname } = request.nextUrl;
  
  // Determine rate limit config based on path
  let rateLimitConfig = rateLimitConfigs.api;
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth')) {
    rateLimitConfig = rateLimitConfigs.auth;
  } else if (pathname.startsWith('/api/upload')) {
    rateLimitConfig = rateLimitConfigs.upload;
  }
  
  // Check rate limiting
  const { allowed, headers: rateLimitHeaders } = checkRateLimit(request, rateLimitConfig);
  
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders,
        },
      }
    );
  }
  
  // Validate CSRF token for state-changing requests
  if (pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const isValidCSRF = await validateCSRFToken(request);
    
    if (!isValidCSRF) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or missing CSRF token' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
  
  // For allowed requests, continue to next middleware/handler
  return; // undefined means continue
}

// Input validation helper
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent DoS
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

// SQL injection prevention helper (for raw queries if ever needed)
export function escapeSQLString(str: string): string {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
    switch (char) {
      case '\0':
        return '\\0';
      case '\x08':
        return '\\b';
      case '\x09':
        return '\\t';
      case '\x1a':
        return '\\z';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '"':
      case "'":
      case '\\':
      case '%':
        return '\\' + char;
      default:
        return char;
    }
  });
}

// XSS prevention helper
export function escapeHTML(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'\/]/g, (char) => htmlEscapes[char]);
}

// File upload validation
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.pdf'],
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }
  
  return { valid: true };
}
