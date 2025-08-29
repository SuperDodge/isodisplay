import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { playlistValidator } from '@/lib/services/playlist-validator';

// GET /api/playlists/[id]/validate - Validate playlist
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const validationResult = await playlistValidator.validatePlaylist(id);

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Error validating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to validate playlist' },
      { status: 500 }
    );
  }
}

// POST /api/playlists/[id]/validate - Fix playlist issues
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
    const { removeMissing, fixDurations, fixTransitions } = body;

    const result = await playlistValidator.fixPlaylistIssues(id, {
      removeMissing: removeMissing ?? false,
      fixDurations: fixDurations ?? true,
      fixTransitions: fixTransitions ?? true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fixing playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fix playlist issues' },
      { status: 500 }
    );
  }
}