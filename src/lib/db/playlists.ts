import { prisma } from '@/lib/prisma';
import { Playlist, PlaylistItem, TransitionType, Prisma } from '@/generated/prisma';
import { z } from 'zod';

// Validation schemas
export const CreatePlaylistSchema = z.object({
  name: z.string().min(1).max(255),
  createdBy: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const UpdatePlaylistSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});

export const CreatePlaylistItemSchema = z.object({
  playlistId: z.string().uuid(),
  contentId: z.string().uuid(),
  duration: z.number().int().min(1),
  order: z.number().int().min(1),
  transitionType: z.nativeEnum(TransitionType).optional(),
  transitionDuration: z.number().int().min(0).optional().nullable(),
});

export const UpdatePlaylistItemSchema = z.object({
  duration: z.number().int().min(1).optional(),
  order: z.number().int().min(1).optional(),
  transitionType: z.nativeEnum(TransitionType).optional(),
  transitionDuration: z.number().int().min(0).optional().nullable(),
});

export type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>;
export type CreatePlaylistItemInput = z.infer<typeof CreatePlaylistItemSchema>;
export type UpdatePlaylistItemInput = z.infer<typeof UpdatePlaylistItemSchema>;

// Playlist CRUD operations
export const playlistDb = {
  // Create new playlist
  async create(data: CreatePlaylistInput): Promise<Playlist> {
    const validated = CreatePlaylistSchema.parse(data);
    
    return prisma.playlist.create({
      data: {
        ...validated,
        isActive: validated.isActive ?? true,
      },
      include: {
        creator: true,
        items: {
          include: {
            content: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        displays: true,
      },
    });
  },

  // Get playlist by ID
  async findById(id: string) {
    return prisma.playlist.findUnique({
      where: { id },
      include: {
        creator: true,
        items: {
          include: {
            content: {
              include: {
                uploadedByUser: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        displays: true,
      },
    });
  },

  // List playlists with pagination
  async list(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.PlaylistOrderByWithRelationInput;
    where?: Prisma.PlaylistWhereInput;
    createdBy?: string;
    isActive?: boolean;
  }) {
    const { 
      skip = 0, 
      take = 20, 
      orderBy = { createdAt: 'desc' }, 
      where,
      createdBy,
      isActive,
    } = params || {};
    
    const whereCondition: Prisma.PlaylistWhereInput = {
      ...where,
      ...(createdBy && { createdBy }),
      ...(isActive !== undefined && { isActive }),
    };
    
    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        skip,
        take,
        orderBy,
        where: whereCondition,
        include: {
          creator: true,
          items: true,
          displays: true,
        },
      }),
      prisma.playlist.count({ where: whereCondition }),
    ]);

    return {
      playlists,
      total,
      hasMore: skip + take < total,
    };
  },

  // Update playlist
  async update(id: string, data: UpdatePlaylistInput): Promise<Playlist> {
    const validated = UpdatePlaylistSchema.parse(data);
    
    return prisma.playlist.update({
      where: { id },
      data: validated,
      include: {
        creator: true,
        items: {
          include: {
            content: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        displays: true,
      },
    });
  },

  // Delete playlist
  async delete(id: string): Promise<Playlist> {
    return prisma.playlist.delete({
      where: { id },
    });
  },

  // Add item to playlist
  async addItem(data: CreatePlaylistItemInput): Promise<PlaylistItem> {
    const validated = CreatePlaylistItemSchema.parse(data);
    
    // Check if order already exists and shift items if needed
    const existingItem = await prisma.playlistItem.findUnique({
      where: {
        playlistId_order: {
          playlistId: validated.playlistId,
          order: validated.order,
        },
      },
    });

    if (existingItem) {
      // Shift all items with order >= new order
      await prisma.playlistItem.updateMany({
        where: {
          playlistId: validated.playlistId,
          order: {
            gte: validated.order,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    }
    
    return prisma.playlistItem.create({
      data: {
        ...validated,
        transitionType: validated.transitionType || TransitionType.CUT,
      },
      include: {
        content: true,
        playlist: true,
      },
    });
  },

  // Update playlist item
  async updateItem(id: string, data: UpdatePlaylistItemInput): Promise<PlaylistItem> {
    const validated = UpdatePlaylistItemSchema.parse(data);
    
    return prisma.playlistItem.update({
      where: { id },
      data: validated,
      include: {
        content: true,
        playlist: true,
      },
    });
  },

  // Remove item from playlist
  async removeItem(id: string): Promise<PlaylistItem> {
    const item = await prisma.playlistItem.delete({
      where: { id },
    });

    // Reorder remaining items
    await prisma.playlistItem.updateMany({
      where: {
        playlistId: item.playlistId,
        order: {
          gt: item.order,
        },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });

    return item;
  },

  // Reorder playlist items
  async reorderItems(playlistId: string, itemIds: string[]): Promise<void> {
    const updates = itemIds.map((id, index) => 
      prisma.playlistItem.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await prisma.$transaction(updates);
  },

  // Duplicate playlist
  async duplicate(id: string, newName: string, createdBy: string): Promise<Playlist> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Playlist not found');
    }

    return prisma.playlist.create({
      data: {
        name: newName,
        createdBy,
        isActive: original.isActive,
        items: {
          create: original.items.map(item => ({
            contentId: item.contentId,
            duration: item.duration,
            order: item.order,
            transitionType: item.transitionType,
            transitionDuration: item.transitionDuration,
          })),
        },
      },
      include: {
        creator: true,
        items: {
          include: {
            content: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        displays: true,
      },
    });
  },

  // Get playlist total duration
  async getTotalDuration(id: string): Promise<number> {
    const items = await prisma.playlistItem.findMany({
      where: { playlistId: id },
    });

    return items.reduce((total, item) => total + item.duration, 0);
  },
};