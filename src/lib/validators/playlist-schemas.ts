/**
 * Playlist Validation Schemas
 * 
 * Zod schemas for validating playlist-related data
 * at the API layer before it reaches the database
 */

import { z } from 'zod';
import { TransitionType } from '@/generated/prisma';

// ============================================
// Enum Schemas
// ============================================

/**
 * Valid transition types from Prisma schema
 */
export const TransitionTypeSchema = z.nativeEnum(TransitionType);

// ============================================
// Playlist Item Schemas
// ============================================

/**
 * Schema for creating/updating a playlist item
 */
export const PlaylistItemSchema = z.object({
  contentId: z.string().uuid('Content ID must be a valid UUID'),
  order: z.number().int().min(0, 'Order must be non-negative'),
  duration: z.number().int().min(1, 'Duration must be at least 1 second'),
  transitionType: TransitionTypeSchema.optional().default(TransitionType.FADE),
  transitionDuration: z.number().int().min(0).optional().default(1000),
});

/**
 * Schema for an array of playlist items
 */
export const PlaylistItemsArraySchema = z.array(PlaylistItemSchema);

// ============================================
// Playlist CRUD Schemas
// ============================================

/**
 * Schema for creating a new playlist
 */
export const CreatePlaylistSchema = z.object({
  name: z.string()
    .min(1, 'Playlist name is required')
    .max(255, 'Playlist name must be less than 255 characters')
    .trim(),
  description: z.string().optional(), // For future use
  isActive: z.boolean().optional().default(true),
  items: PlaylistItemsArraySchema.optional().default([]),
  tags: z.array(z.string()).optional(), // For future use
});

/**
 * Schema for updating an existing playlist
 */
export const UpdatePlaylistSchema = z.object({
  name: z.string()
    .min(1, 'Playlist name is required')
    .max(255, 'Playlist name must be less than 255 characters')
    .trim()
    .optional(),
  description: z.string().optional(), // For future use
  isActive: z.boolean().optional(),
  items: PlaylistItemsArraySchema.optional(),
  tags: z.array(z.string()).optional(), // For future use
});

/**
 * Schema for duplicating a playlist
 */
export const DuplicatePlaylistSchema = z.object({
  newName: z.string()
    .min(1, 'New playlist name is required')
    .max(255, 'Playlist name must be less than 255 characters')
    .trim()
    .optional(),
});

// ============================================
// Query Parameter Schemas
// ============================================

/**
 * Schema for playlist list query parameters
 */
export const PlaylistQuerySchema = z.object({
  includeShared: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  isActive: z.enum(['true', 'false']).optional().transform(val => val !== 'false'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================
// Response Validation Schemas
// ============================================

/**
 * Schema for validating API playlist response
 * Used to ensure our API returns the correct format
 */
export const ApiPlaylistResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdBy: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(), // ISO 8601 string
  updatedAt: z.string().datetime(), // ISO 8601 string
  items: z.array(z.object({
    id: z.string().uuid(),
    playlistId: z.string().uuid(),
    contentId: z.string().uuid(),
    order: z.number().int(),
    duration: z.number().int(),
    transitionType: z.string(),
    transitionDuration: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    content: z.object({
      id: z.string().uuid(),
      name: z.string(),
      fileName: z.string(),
      filePath: z.string(),
      type: z.string(),
    }).optional(),
  })).optional(),
  creator: z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
  }).optional(),
  displays: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    urlSlug: z.string(),
  })).optional(),
});

// ============================================
// Validation Functions
// ============================================

/**
 * Validate create playlist request
 */
export function validateCreatePlaylist(data: unknown) {
  return CreatePlaylistSchema.safeParse(data);
}

/**
 * Validate update playlist request
 */
export function validateUpdatePlaylist(data: unknown) {
  return UpdatePlaylistSchema.safeParse(data);
}

/**
 * Validate playlist query parameters
 */
export function validatePlaylistQuery(params: URLSearchParams) {
  const query = Object.fromEntries(params.entries());
  return PlaylistQuerySchema.safeParse(query);
}

/**
 * Validate API response format (for development/testing)
 */
export function validateApiPlaylistResponse(data: unknown) {
  return ApiPlaylistResponseSchema.safeParse(data);
}

// ============================================
// Type Exports
// ============================================

export type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>;
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>;
export type PlaylistQuery = z.infer<typeof PlaylistQuerySchema>;
export type ApiPlaylistResponse = z.infer<typeof ApiPlaylistResponseSchema>;