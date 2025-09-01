import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { playlistService } from '@/lib/services/playlist-service';
import { databaseToApiPlaylist } from '@/lib/transformers/api-transformers';
import { 
  validateUpdatePlaylist,
  type UpdatePlaylistInput 
} from '@/lib/validators/playlist-schemas';
import { validationErrorResponse, ErrorResponses, isValidUUID } from '@/lib/validators/api-validators';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/playlists/[id] - Get single playlist
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid playlist ID format');
    }
    
    // Verify the user exists in the database (fix for session/database mismatch)
    const { prisma } = await import('@/lib/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    let actualUserId = user.id;
    if (!dbUser) {
      // If user doesn't exist, try to find by email
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (!userByEmail) {
        return NextResponse.json({ error: 'User account not found. Please log out and log in again.' }, { status: 401 });
      }
      
      // Use the correct user ID from the database
      actualUserId = userByEmail.id;
    }
    
    const playlist = await playlistService.getPlaylist(id);
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Check if user has access to this playlist
    if (playlist.createdBy !== actualUserId && !user.permissions?.includes('PLAYLIST_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Transform database response to API format
    const apiResponse = databaseToApiPlaylist(playlist);

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

// PUT /api/playlists/[id] - Update playlist (with debug)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid playlist ID format');
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = validateUpdatePlaylist(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }
    
    const validatedData = validation.data as UpdatePlaylistInput;

    // Verify the user exists in the database (fix for session/database mismatch)
    const { prisma } = await import('@/lib/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    let actualUserId = user.id;
    if (!dbUser) {
      // If user doesn't exist, try to find by email
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (!userByEmail) {
        return NextResponse.json({ error: 'User account not found. Please log out and log in again.' }, { status: 401 });
      }
      
      // Use the correct user ID from the database
      actualUserId = userByEmail.id;
    }

    // Authorization: allow if owner or has admin-level perms
    const existingPlaylist = await playlistService.getPlaylist(id);
    if (!existingPlaylist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const perms = (user.permissions as string[]) || [];
    const isOwner = existingPlaylist.createdBy === actualUserId;
    const isAdmin = perms.includes('USER_CONTROL') || perms.includes('SYSTEM_SETTINGS') || perms.includes('PLAYLIST_CREATE');
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const playlist = await playlistService.updatePlaylist(id, actualUserId, {
      name: validatedData.name,
      items: validatedData.items,
      isActive: validatedData.isActive,
    });


    // Transform database response to API format
    const apiResponse = databaseToApiPlaylist(playlist);

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[id] - Delete (archive) playlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('[API DELETE] Starting playlist deletion');
    
    const user = await getCurrentUser();
    console.log('[API DELETE] User:', user?.id, user?.username);
    
    if (!user?.id) {
      console.log('[API DELETE] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('[API DELETE] Playlist ID to delete:', id);
    
    // Validate ID format
    if (!isValidUUID(id)) {
      console.log('[API DELETE] Invalid UUID format:', id);
      return ErrorResponses.badRequest('Invalid playlist ID format');
    }
    
    console.log('[API DELETE] Calling playlistService.deletePlaylist');
    const success = await playlistService.deletePlaylist(id, user.id);
    console.log('[API DELETE] Delete result:', success);
    
    if (!success) {
      console.log('[API DELETE] Playlist not found or user not authorized');
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    console.log('[API DELETE] Successfully deleted playlist');
    return NextResponse.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('[API DELETE] Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
