import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all displays with their playlist information
    const displays = await prisma.display.findMany({
      include: {
        playlist: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { isOnline: 'desc' }, // Online displays first
        { name: 'asc' }       // Then alphabetical
      ]
    });

    // Calculate stats
    const total = displays.length;
    const online = displays.filter(d => d.isOnline).length;
    const offline = total - online;

    return NextResponse.json({
      total,
      online,
      offline,
      displays: displays.map(display => ({
        id: display.id,
        name: display.name,
        urlSlug: display.urlSlug,
        isOnline: display.isOnline,
        lastSeen: display.lastSeen?.toISOString() || null,
        resolution: display.resolution,
        orientation: display.orientation,
        playlist: display.playlist
      }))
    });

  } catch (error) {
    console.error('Display stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}