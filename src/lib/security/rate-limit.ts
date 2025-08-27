import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 60000);
  }

  check(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs
      };
      return {
        allowed: true,
        remaining: config.max - 1,
        resetTime: this.store[key].resetTime
      };
    }

    if (this.store[key].count < config.max) {
      this.store[key].count++;
      return {
        allowed: true,
        remaining: config.max - this.store[key].count,
        resetTime: this.store[key].resetTime
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: this.store[key].resetTime
    };
  }

  reset(identifier: string): void {
    delete this.store[identifier];
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000 // Temporarily disabled - reduce to 5 in production
  },
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100 // 100 requests per window
  },
  upload: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10 // 10 uploads per window
  }
};

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown-client';
}

// Main rate limiting function
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
): { allowed: boolean; headers: Record<string, string> } {
  const identifier = getClientIdentifier(request);
  const result = rateLimiter.check(identifier, config);
  
  return {
    allowed: result.allowed,
    headers: {
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      'Retry-After': result.allowed ? '' : Math.ceil((result.resetTime - Date.now()) / 1000).toString()
    }
  };
}

// Reset rate limit for a specific client
export function resetRateLimit(request: NextRequest): void {
  const identifier = getClientIdentifier(request);
  rateLimiter.reset(identifier);
}