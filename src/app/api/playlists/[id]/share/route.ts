import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { playlistService } from '@/lib/services/playlist-service';

// POST /api/playlists/[id]/share - Share playlist with users
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
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    const success = await playlistService.sharePlaylist(
      id,
      user.id,
      userIds
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Playlist not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Playlist shared successfully' });
  } catch (error) {
    console.error('Error sharing playlist:', error);
    return NextResponse.json(
      { error: 'Failed to share playlist' },
      { status: 500 }
    );
  }
}