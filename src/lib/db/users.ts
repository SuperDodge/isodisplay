import { prisma } from '@/lib/prisma';
import { User, Permission, Prisma } from '@/generated/prisma';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schemas
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// User CRUD operations
export const userDb = {
  // Create a new user
  async create(data: CreateUserInput): Promise<User> {
    const validated = CreateUserSchema.parse(data);
    const hashedPassword = await bcrypt.hash(validated.password, 10);
    
    return prisma.user.create({
      data: {
        ...validated,
        password: hashedPassword,
        permissions: validated.permissions || [],
      },
    });
  },

  // Get user by ID
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        playlists: true,
        content: true,
      },
    });
  },

  // Get user by email
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  // Get user by username
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  // Get all users (for admin interface)
  async findMany(params?: {
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
  }): Promise<any[]> {
    const { orderBy = { createdAt: 'desc' }, where } = params || {};
    
    return prisma.user.findMany({
      orderBy,
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  },

  // List all users with pagination
  async list(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
  }) {
    const { skip = 0, take = 10, orderBy = { createdAt: 'desc' }, where } = params || {};
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy,
        where,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      hasMore: skip + take < total,
    };
  },

  // Update user
  async update(id: string, data: UpdateUserInput): Promise<User> {
    const validated = UpdateUserSchema.parse(data);
    
    if (validated.password) {
      validated.password = await bcrypt.hash(validated.password, 10);
    }
    
    return prisma.user.update({
      where: { id },
      data: validated,
    });
  },

  // Delete user (cascade deletes related records)
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  },

  // Verify password
  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  },

  // Update last login
  async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
      },
    });
  },

  // Check if user has permission
  hasPermission(user: User, permission: Permission): boolean {
    return user.permissions.includes(permission);
  },

  // Check if user has any of the permissions
  hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(p => user.permissions.includes(p));
  },

  // Check if user has all permissions
  hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(p => user.permissions.includes(p));
  },
};