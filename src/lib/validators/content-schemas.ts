/**
 * Content Validation Schemas
 * 
 * Zod schemas for validating content-related data
 * at the API layer before it reaches the database
 */

import { z } from 'zod';
import { ContentType } from '@/generated/prisma';

// ============================================
// Enum Schemas
// ============================================

/**
 * Valid content types from Prisma schema
 */
export const ContentTypeSchema = z.nativeEnum(ContentType);

/**
 * Valid thumbnail sizes
 */
export const ThumbnailSizeSchema = z.enum(['small', 'medium', 'large', 'display']);

// ============================================
// Content Metadata Schemas
// ============================================

/**
 * Schema for image metadata
 */
const ImageMetadataSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
  colorSpace: z.string().optional(),
  imageScale: z.enum(['contain', 'cover', 'fill']).optional(),
  imageSize: z.number().int().min(10).max(100).optional(),
});

/**
 * Schema for video metadata
 */
const VideoMetadataSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(), // Duration in seconds
  frameRate: z.number().positive().optional(),
  codec: z.string().optional(),
  bitrate: z.number().int().positive().optional(),
});

/**
 * Schema for PDF metadata
 */
const PdfMetadataSchema = z.object({
  pageCount: z.number().int().positive().optional(),
  version: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
});

/**
 * Combined metadata schema based on content type
 */
export const ContentMetadataSchema = z.union([
  ImageMetadataSchema,
  VideoMetadataSchema,
  PdfMetadataSchema,
  z.object({}), // Allow empty metadata
]);

// ============================================
// Content CRUD Schemas
// ============================================

/**
 * Schema for creating new content (used during upload)
 */
export const CreateContentSchema = z.object({
  name: z.string()
    .min(1, 'Content name is required')
    .max(255, 'Content name must be less than 255 characters')
    .trim(),
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters'),
  filePath: z.string()
    .min(1, 'File path is required'),
  fileSize: z.union([
    z.string(), // BigInt as string
    z.number().int().nonnegative(),
  ]).optional(),
  type: ContentTypeSchema,
  mimeType: z.string()
    .min(1, 'MIME type is required')
    .max(100, 'MIME type must be less than 100 characters'),
  originalName: z.string().optional(),
  duration: z.number().int().positive().optional(), // Duration in seconds for video content
  metadata: ContentMetadataSchema.optional(),
  backgroundColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color')
    .optional(),
});

/**
 * Schema for updating existing content
 */
export const UpdateContentSchema = z.object({
  name: z.string()
    .min(1, 'Content name cannot be empty')
    .max(255, 'Content name must be less than 255 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
  duration: z.number().int().nonnegative().optional(), // Duration in seconds (0 means default)
  metadata: ContentMetadataSchema.optional(),
  backgroundColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color')
    .optional(),
});

/**
 * Schema for batch operations
 */
export const BatchContentOperationSchema = z.object({
  ids: z.array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one content ID is required')
    .max(100, 'Cannot process more than 100 items at once'),
});

// ============================================
// Query Parameter Schemas
// ============================================

/**
 * Schema for content list query parameters
 */
export const ContentQuerySchema = z.object({
  search: z.string().optional(),
  type: z.union([
    ContentTypeSchema,
    z.literal('all'),
  ]).optional().default('all'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'fileSize']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.string().transform(Number).pipe(
    z.number().int().positive().max(100)
  ).optional().default('50'),
  offset: z.string().transform(Number).pipe(
    z.number().int().nonnegative()
  ).optional().default('0'),
});

// ============================================
// Upload Validation Schemas
// ============================================

/**
 * Schema for file upload validation
 */
export const FileUploadSchema = z.object({
  file: z.object({
    name: z.string(),
    size: z.number().max(500 * 1024 * 1024, 'File size must be less than 500MB'),
    type: z.string(),
  }),
  name: z.string().optional(),
  backgroundColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color')
    .optional(),
});

// ============================================
// Response Validation Schemas
// ============================================

/**
 * Schema for validating API content response
 */
export const ApiContentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.string().nullable(), // BigInt as string
  type: z.string(),
  mimeType: z.string(),
  metadata: z.any().nullable(),
  backgroundColor: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  thumbnails: z.array(z.object({
    id: z.string().uuid(),
    contentId: z.string().uuid(),
    filePath: z.string(),
    size: z.string(),
    fileSize: z.string(), // BigInt as string
    createdAt: z.string().datetime(),
  })).optional(),
  thumbnailUrl: z.string().optional(),
});

// ============================================
// Validation Functions
// ============================================

/**
 * Validate create content request
 */
export function validateCreateContent(data: unknown) {
  return CreateContentSchema.safeParse(data);
}

/**
 * Validate update content request
 */
export function validateUpdateContent(data: unknown) {
  return UpdateContentSchema.safeParse(data);
}

/**
 * Validate batch operation request
 */
export function validateBatchOperation(data: unknown) {
  return BatchContentOperationSchema.safeParse(data);
}

/**
 * Validate content query parameters
 */
export function validateContentQuery(params: URLSearchParams) {
  const query = Object.fromEntries(params.entries());
  return ContentQuerySchema.safeParse(query);
}

/**
 * Validate file upload
 */
export function validateFileUpload(data: unknown) {
  return FileUploadSchema.safeParse(data);
}

/**
 * Validate API response format (for development/testing)
 */
export function validateApiContentResponse(data: unknown) {
  return ApiContentResponseSchema.safeParse(data);
}

// ============================================
// Type Exports
// ============================================

export type CreateContentInput = z.infer<typeof CreateContentSchema>;
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;
export type BatchContentOperation = z.infer<typeof BatchContentOperationSchema>;
export type ContentQuery = z.infer<typeof ContentQuerySchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type ApiContentResponse = z.infer<typeof ApiContentResponseSchema>;