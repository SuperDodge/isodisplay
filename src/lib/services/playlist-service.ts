import { prisma } from '@/lib/prisma';
import { TransitionType } from '@/generated/prisma';

interface CreatePlaylistInput {
  name: string;
  items?: Array<{
    contentId: string;
    duration: number;
    order: number;
    transitionType?: TransitionType;
    transitionDuration?: number;
  }>;
  createdBy: string;
}

interface UpdatePlaylistInput {
  name?: string;
  items?: Array<{
    contentId: string;
    duration: number;
    order: number;
    transitionType?: TransitionType;
    transitionDuration?: number;
  }>;
  isActive?: boolean;
}

class PlaylistService {
  // Create new playlist with items
  async createPlaylist(input: CreatePlaylistInput) {
    const playlist = await prisma.$transaction(async (tx) => {
      // Create playlist
      const newPlaylist = await tx.playlist.create({
        data: {
          name: input.name,
          createdBy: input.createdBy,
          isActive: true,
        },
      });

      // Create playlist items if provided
      if (input.items && input.items.length > 0) {
        await tx.playlistItem.createMany({
          data: input.items.map((item, index) => ({
            playlistId: newPlaylist.id,
            contentId: item.contentId,
            order: item.order ?? index,
            duration: item.duration ?? 10,
            transitionType: item.transitionType ?? TransitionType.FADE,
            transitionDuration: item.transitionDuration ?? 1000,
          })),
        });
      }

      // Fetch complete playlist with items
      return await tx.playlist.findUnique({
        where: { id: newPlaylist.id },
        include: {
          items: {
            include: {
              content: {
                include: {
                  thumbnails: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });

    return playlist;
  }

  // Get playlist by ID
  async getPlaylist(playlistId: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        items: {
          include: {
            content: {
              include: {
                thumbnails: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        displays: true,
      },
    });

    return playlist;
  }

  // Get all playlists for user
  async getUserPlaylists(userId: string, includeShared: boolean = true, activeOnly: boolean = true, isAdmin: boolean = false) {
    const whereClause: any = {};

    // If not admin, only show user's own playlists
    if (!isAdmin) {
      whereClause.createdBy = userId;
    }

    if (activeOnly) {
      whereClause.isActive = true;
    }

    const playlists = await prisma.playlist.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            content: {
              include: {
                thumbnails: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        displays: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return playlists;
  }

  // Update playlist
  async updatePlaylist(playlistId: string, userId: string, input: UpdatePlaylistInput) {
    const playlist = await prisma.$transaction(async (tx) => {
      // Update playlist metadata
      await tx.playlist.update({
        where: { id: playlistId },
        data: {
          name: input.name,
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      });

      // Update items if provided
      if (input.items) {
        // Delete existing items
        await tx.playlistItem.deleteMany({
          where: { playlistId },
        });

        // Create new items
        if (input.items.length > 0) {
          await tx.playlistItem.createMany({
            data: input.items.map((item, index) => ({
              playlistId,
              contentId: item.contentId,
              order: item.order ?? index,
              duration: item.duration ?? 10,
              transitionType: item.transitionType ?? TransitionType.FADE,
              transitionDuration: item.transitionDuration ?? 1000,
            })),
          });
        }
      }

      // Fetch updated playlist
      return await tx.playlist.findUnique({
        where: { id: playlistId },
        include: {
          items: {
            include: {
              content: {
                include: {
                  thumbnails: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          displays: true,
        },
      });
    });

    return playlist;
  }

  // Delete (soft delete) playlist
  async deletePlaylist(playlistId: string, userId: string): Promise<boolean> {
    console.log('[PLAYLIST SERVICE] Attempting to delete playlist:', {
      playlistId,
      userId,
    });
    
    // First, check if the playlist exists and who owns it
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { id: true, createdBy: true, isActive: true }
    });
    
    console.log('[PLAYLIST SERVICE] Found playlist:', playlist);
    
    if (!playlist) {
      console.log('[PLAYLIST SERVICE] Playlist not found');
      return false;
    }
    
    if (playlist.createdBy !== userId) {
      console.log('[PLAYLIST SERVICE] User does not own playlist. Owner:', playlist.createdBy, 'User:', userId);
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { permissions: true }
      });
      
      const isAdmin = user?.permissions?.includes('PLAYLIST_CREATE') || 
                     user?.permissions?.includes('USER_CONTROL') ||
                     user?.permissions?.includes('SYSTEM_SETTINGS');
      
      console.log('[PLAYLIST SERVICE] User is admin:', isAdmin);
      
      if (!isAdmin) {
        return false;
      }
    }
    
    // Update the playlist (either owner or admin can delete)
    const result = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
    
    console.log('[PLAYLIST SERVICE] Delete result:', {
      success: true,
      updatedPlaylist: result.id,
    });

    return true;
  }

  // Duplicate playlist
  async duplicatePlaylist(playlistId: string, userId: string, newName?: string) {
    const original = await this.getPlaylist(playlistId);
    if (!original) return null;

    return await this.createPlaylist({
      name: newName || `${original.name} (Copy)`,
      items: original.items.map((item) => ({
        contentId: item.contentId,
        order: item.order,
        duration: item.duration,
        transitionType: item.transitionType,
        transitionDuration: item.transitionDuration,
      })),
      createdBy: userId,
    });
  }

  // Alias for getPlaylist to maintain compatibility with WebSocket service
  async getById(playlistId: string) {
    return this.getPlaylist(playlistId);
  }
}

export const playlistService = new PlaylistService();
