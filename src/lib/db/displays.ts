import { prisma } from '@/lib/prisma';
import { Display, DisplayOrientation, Prisma } from '@/generated/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Validation schemas
export const CreateDisplaySchema = z.object({
  name: z.string().min(1).max(255),
  urlSlug: z.string().min(1).max(100).optional(),
  playlistId: z.string().uuid().optional().nullable(),
  resolution: z.string().regex(/^\d+x\d+$/).optional(),
  orientation: z.nativeEnum(DisplayOrientation).optional(),
});

export const UpdateDisplaySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  urlSlug: z.string().min(1).max(100).optional(),
  playlistId: z.string().uuid().optional().nullable(),
  resolution: z.string().regex(/^\d+x\d+$/).optional(),
  orientation: z.nativeEnum(DisplayOrientation).optional(),
});

export type CreateDisplayInput = z.infer<typeof CreateDisplaySchema>;
export type UpdateDisplayInput = z.infer<typeof UpdateDisplaySchema>;

// Display CRUD operations
export const displayDb = {
  // Create new display
  async create(data: CreateDisplayInput): Promise<Display> {
    const validated = CreateDisplaySchema.parse(data);
    
    // Generate unique URL slug if not provided
    if (!validated.urlSlug) {
      validated.urlSlug = nanoid(10);
    }
    
    // Check for unique slug
    const existing = await prisma.display.findUnique({
      where: { urlSlug: validated.urlSlug },
    });
    
    if (existing) {
      throw new Error('URL slug already exists');
    }
    
    return prisma.display.create({
      data: {
        ...validated,
        resolution: validated.resolution || '1920x1080',
        orientation: validated.orientation || DisplayOrientation.LANDSCAPE,
      },
      include: {
        playlist: {
          include: {
            items: {
              include: {
                content: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  },

  // Get display by ID
  async findById(id: string): Promise<Display | null> {
    return prisma.display.findUnique({
      where: { id },
      include: {
        playlist: {
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
          },
        },
      },
    });
  },

  // Get display by URL slug
  async findBySlug(urlSlug: string): Promise<Display | null> {
    return prisma.display.findUnique({
      where: { urlSlug },
      include: {
        playlist: {
          include: {
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
          },
        },
      },
    });
  },

  // List displays with pagination
  async list(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.DisplayOrderByWithRelationInput;
    where?: Prisma.DisplayWhereInput;
    isOnline?: boolean;
    playlistId?: string;
  }) {
    const { 
      skip = 0, 
      take = 20, 
      orderBy = { createdAt: 'desc' }, 
      where,
      isOnline,
      playlistId,
    } = params || {};
    
    const whereCondition: Prisma.DisplayWhereInput = {
      ...where,
      ...(isOnline !== undefined && { isOnline }),
      ...(playlistId && { playlistId }),
    };
    
    const [displays, total] = await Promise.all([
      prisma.display.findMany({
        skip,
        take,
        orderBy,
        where: whereCondition,
        include: {
          playlist: true,
        },
      }),
      prisma.display.count({ where: whereCondition }),
    ]);

    return {
      displays,
      total,
      hasMore: skip + take < total,
    };
  },

  // Update display
  async update(id: string, data: UpdateDisplayInput): Promise<Display> {
    const validated = UpdateDisplaySchema.parse(data);
    
    // Check for unique slug if updating
    if (validated.urlSlug) {
      const existing = await prisma.display.findFirst({
        where: { 
          urlSlug: validated.urlSlug,
          NOT: { id },
        },
      });
      
      if (existing) {
        throw new Error('URL slug already exists');
      }
    }
    
    return prisma.display.update({
      where: { id },
      data: validated,
      include: {
        playlist: {
          include: {
            items: {
              include: {
                content: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  },

  // Delete display
  async delete(id: string): Promise<Display> {
    return prisma.display.delete({
      where: { id },
    });
  },

  // Update display heartbeat
  async heartbeat(id: string): Promise<Display> {
    return prisma.display.update({
      where: { id },
      data: {
        lastSeen: new Date(),
        isOnline: true,
      },
    });
  },

  // Mark displays offline (for scheduled job)
  async markOfflineDisplays(offlineThresholdMinutes: number = 2): Promise<number> {
    const threshold = new Date(Date.now() - offlineThresholdMinutes * 60 * 1000);
    
    const result = await prisma.display.updateMany({
      where: {
        isOnline: true,
        lastSeen: {
          lt: threshold,
        },
      },
      data: {
        isOnline: false,
      },
    });

    return result.count;
  },

  // Assign playlist to display
  async assignPlaylist(displayId: string, playlistId: string | null): Promise<Display> {
    return prisma.display.update({
      where: { id: displayId },
      data: { playlistId },
      include: {
        playlist: {
          include: {
            items: {
              include: {
                content: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  },

  // Get online displays
  async getOnlineDisplays() {
    return prisma.display.findMany({
      where: { isOnline: true },
      include: {
        playlist: true,
      },
    });
  },

  // Get displays without playlist
  async getUnassignedDisplays() {
    return prisma.display.findMany({
      where: { playlistId: null },
      orderBy: { name: 'asc' },
    });
  },

  // Bulk create displays
  async bulkCreate(names: string[], resolution?: string, orientation?: DisplayOrientation) {
    const displays = names.map(name => ({
      name,
      urlSlug: nanoid(10),
      resolution: resolution || '1920x1080',
      orientation: orientation || DisplayOrientation.LANDSCAPE,
    }));

    return prisma.display.createMany({
      data: displays,
    });
  },

  // Generate unique slug
  async generateUniqueSlug(baseName: string): Promise<string> {
    const slug = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    let suffix = '';
    let counter = 1;

    while (true) {
      const testSlug = slug + suffix;
      const existing = await prisma.display.findUnique({
        where: { urlSlug: testSlug },
      });
      
      if (!existing) {
        return testSlug;
      }
      
      suffix = `-${counter}`;
      counter++;
    }
  },
};