import { NextRequest, NextResponse } from 'next/server';
import { displayService } from '@/lib/services/display-service';

// Helper to serialize BigInt values
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  return obj;
}

// GET /api/display/[url] - Get display by unique URL (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ url: string }> }
) {
  try {
    const { url } = await params;
    
    if (!url) {
      return NextResponse.json(
        { error: 'Display URL is required' },
        { status: 400 }
      );
    }

    // Get display by URL slug (no auth required for public display viewing)
    const display = await displayService.getDisplayByUrl(url);

    if (!display) {
      return NextResponse.json(
        { error: 'Display not found' },
        { status: 404 }
      );
    }

    // Serialize BigInt values before returning
    const serializedDisplay = serializeBigInt(display);

    // Return the display with its assigned playlist
    return NextResponse.json(serializedDisplay);
  } catch (error) {
    console.error('Error fetching display by URL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch display' },
      { status: 500 }
    );
  }
}