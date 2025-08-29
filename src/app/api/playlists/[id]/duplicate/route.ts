import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { playlistService } from '@/lib/services/playlist-service';

// POST /api/playlists/[id]/duplicate - Duplicate playlist
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    const duplicatedPlaylist = await playlistService.duplicatePlaylist(
      id,
      user.id,
      name
    );

    if (!duplicatedPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(duplicatedPlaylist, { status: 201 });
  } catch (error) {
    console.error('Error duplicating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate playlist' },
      { status: 500 }
    );
  }
}