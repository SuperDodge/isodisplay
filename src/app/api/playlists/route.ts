import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { playlistService } from '@/lib/services/playlist-service';
import { databaseToApiPlaylist } from '@/lib/transformers/api-transformers';
import { 
  validateCreatePlaylist, 
  validatePlaylistQuery,
  type CreatePlaylistInput 
} from '@/lib/validators/playlist-schemas';
import { validationErrorResponse, ErrorResponses } from '@/lib/validators/api-validators';

// GET /api/playlists - Get all playlists for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = validatePlaylistQuery(searchParams);
    
    if (!queryValidation.success) {
      return validationErrorResponse(queryValidation.error);
    }
    
    const { includeShared, isActive } = queryValidation.data;
    
    // Check if user has admin permissions (USER_CONTROL or SYSTEM_SETTINGS)
    const isAdmin = user.permissions?.includes('USER_CONTROL') || 
                    user.permissions?.includes('SYSTEM_SETTINGS') || 
                    user.permissions?.includes('PLAYLIST_CREATE');

    const playlists = await playlistService.getUserPlaylists(
      user.id,
      includeShared,
      isActive,
      isAdmin
    );

    // Transform database response to API format
    const apiResponse = playlists.map(databaseToApiPlaylist);

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

// POST /api/playlists - Create new playlist
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = validateCreatePlaylist(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }
    
    const validatedData = validation.data as CreatePlaylistInput;

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

    const playlist = await playlistService.createPlaylist({
      name: validatedData.name,
      items: validatedData.items || [],
      createdBy: actualUserId,
    });

    // Transform database response to API format
    const apiResponse = databaseToApiPlaylist(playlist);

    return NextResponse.json(apiResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}