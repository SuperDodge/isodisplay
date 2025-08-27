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

    // Get all playlists with their items and displays
    const playlists = await prisma.playlist.findMany({
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        displays: {
          select: { id: true, lastSeen: true }
        },
        creator: {
          select: { username: true, firstName: true, lastName: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate statistics
    const totalPlaylists = playlists.length;
    const activePlaylists = playlists.filter(p => p.isActive).length;
    
    let totalPlaytimeSeconds = 0;
    let totalItems = 0;

    const playlistMetrics = playlists.map(playlist => {
      const itemCount = playlist.items.length;
      totalItems += itemCount;

      // Calculate total duration for this playlist
      const playlistDurationSeconds = playlist.items.reduce((sum, item) => sum + item.duration, 0);
      totalPlaytimeSeconds += playlistDurationSeconds;

      // Find the most recent last seen time from displays using this playlist
      const lastUsed = playlist.displays.length > 0 
        ? playlist.displays.reduce((latest, display) => {
            if (!display.lastSeen) return latest;
            if (!latest) return display.lastSeen;
            return display.lastSeen > latest ? display.lastSeen : latest;
          }, null as Date | null)
        : null;

      // Format creator name
      const creator = playlist.creator.firstName || playlist.creator.lastName
        ? `${playlist.creator.firstName || ''} ${playlist.creator.lastName || ''}`.trim()
        : playlist.creator.username;

      return {
        id: playlist.id,
        name: playlist.name,
        itemCount,
        totalDuration: formatDuration(playlistDurationSeconds),
        displayCount: playlist.displays.length,
        isActive: playlist.isActive,
        lastUsed: lastUsed?.toISOString() || null,
        creator
      };
    });

    const avgItemsPerPlaylist = totalPlaylists > 0 ? Math.round(totalItems / totalPlaylists) : 0;

    return NextResponse.json({
      totalPlaylists,
      activePlaylists,
      totalPlaytime: formatDuration(totalPlaytimeSeconds),
      avgItemsPerPlaylist,
      playlists: playlistMetrics
    });

  } catch (error) {
    console.error('Playlist metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}