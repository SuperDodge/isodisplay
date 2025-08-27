import { NextRequest, NextResponse } from 'next/server';
import { resetRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  // Reset rate limit for the current client
  resetRateLimit(request);
  
  return NextResponse.json({ 
    success: true, 
    message: 'Rate limit has been reset' 
  });
}