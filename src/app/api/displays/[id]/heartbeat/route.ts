import { NextRequest, NextResponse } from 'next/server';
import { displayService } from '@/lib/services/display-service';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/displays/[id]/heartbeat - Update display heartbeat
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update last seen
    await displayService.updateLastSeen(params.id, ip, userAgent);

    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}