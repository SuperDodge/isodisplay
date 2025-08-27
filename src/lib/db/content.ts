import { prisma } from '@/lib/prisma';
import { Content, ContentType, Prisma } from '@/generated/prisma';
import { z } from 'zod';

// Validation schemas
export const CreateContentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(ContentType),
  filePath: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  cropSettings: z.record(z.any()).optional().nullable(),
  uploadedBy: z.string().uuid(),
});

export const UpdateContentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  filePath: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  cropSettings: z.record(z.any()).optional().nullable(),
});

export type CreateContentInput = z.infer<typeof CreateContentSchema>;
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;

// Content CRUD operations
export const contentDb = {
  // Create new content
  async create(data: CreateContentInput): Promise<Content> {
    const validated = CreateContentSchema.parse(data);
    
    return prisma.content.create({
      data: validated,
      include: {
        uploadedByUser: true,
      },
    });
  },

  // Get content by ID
  async findById(id: string): Promise<Content | null> {
    return prisma.content.findUnique({
      where: { id, deletedAt: null },
      include: {
        uploadedByUser: true,
        playlistItems: {
          include: {
            playlist: true,
          },
        },
      },
    });
  },

  // List content with pagination and filters
  async list(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ContentOrderByWithRelationInput;
    where?: Prisma.ContentWhereInput;
    type?: ContentType;
    uploadedBy?: string;
  }) {
    const { 
      skip = 0, 
      take = 20, 
      orderBy = { createdAt: 'desc' }, 
      where,
      type,
      uploadedBy,
    } = params || {};
    
    const whereCondition: Prisma.ContentWhereInput = {
      ...where,
      deletedAt: null,
      ...(type && { type }),
      ...(uploadedBy && { uploadedBy }),
    };
    
    const [content, total] = await Promise.all([
      prisma.content.findMany({
        skip,
        take,
        orderBy,
        where: whereCondition,
        include: {
          uploadedByUser: true,
        },
      }),
      prisma.content.count({ where: whereCondition }),
    ]);

    return {
      content,
      total,
      hasMore: skip + take < total,
    };
  },

  // Update content
  async update(id: string, data: UpdateContentInput): Promise<Content> {
    const validated = UpdateContentSchema.parse(data);
    
    return prisma.content.update({
      where: { id },
      data: validated,
      include: {
        uploadedByUser: true,
      },
    });
  },

  // Soft delete content
  async softDelete(id: string): Promise<Content> {
    return prisma.content.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  // Hard delete content
  async delete(id: string): Promise<Content> {
    return prisma.content.delete({
      where: { id },
    });
  },

  // Restore soft-deleted content
  async restore(id: string): Promise<Content> {
    return prisma.content.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  },

  // Get content by type
  async findByType(type: ContentType) {
    return prisma.content.findMany({
      where: { 
        type,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get content usage in playlists
  async getUsage(id: string) {
    return prisma.playlistItem.findMany({
      where: { contentId: id },
      include: {
        playlist: {
          include: {
            displays: true,
          },
        },
      },
    });
  },

  // Bulk delete content
  async bulkDelete(ids: string[]) {
    return prisma.content.updateMany({
      where: { 
        id: { in: ids },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  // Search content by name
  async search(query: string) {
    return prisma.content.findMany({
      where: {
        deletedAt: null,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        uploadedByUser: true,
      },
    });
  },
};