/**
 * API Data Transformers
 * 
 * Functions to transform data between:
 * - Database (Prisma) format
 * - API response format
 * - Frontend UI format
 */

import type {
  ApiPlaylistResponse,
  ApiPlaylistItemResponse,
  ApiContentResponse,
  ApiUserResponse,
  ApiDisplayResponse,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
} from '@/lib/types/api-types';

import type {
  Playlist,
  PlaylistItem,
  TransitionEffect,
} from '@/types/playlist';

import { TransitionType, ContentType, DisplayOrientation } from '@/generated/prisma';

// ============================================
// API to Frontend Transformers
// ============================================

/**
 * Transform API playlist response to frontend Playlist type
 */
export function apiToFrontendPlaylist(apiPlaylist: ApiPlaylistResponse): Playlist {
  return {
    id: apiPlaylist.id,
    name: apiPlaylist.name,
    description: apiPlaylist.description || '',
    items: apiPlaylist.items?.map(apiToFrontendPlaylistItem) || [],
    totalDuration: calculateTotalDuration(apiPlaylist.items || []),
    createdBy: apiPlaylist.createdBy || apiPlaylist.creator?.id || '',
    createdAt: new Date(apiPlaylist.createdAt),
    updatedAt: new Date(apiPlaylist.updatedAt),
    isActive: apiPlaylist.isActive,
    sharedWith: apiPlaylist.sharedWith || [],
    tags: apiPlaylist.tags || [],
  };
}

/**
 * Transform API playlist item to frontend PlaylistItem type
 */
export function apiToFrontendPlaylistItem(apiItem: ApiPlaylistItemResponse): PlaylistItem {
  return {
    id: apiItem.id,
    contentId: apiItem.contentId,
    order: apiItem.order,
    duration: apiItem.duration,
    transition: transitionTypeToEffect(apiItem.transitionType),
    transitionDuration: (apiItem.transitionDuration || 1000) / 1000, // ms to seconds
    title: apiItem.content?.name || `Item ${apiItem.order + 1}`,
    thumbnail: getThumbnailUrl(apiItem.content),
    contentType: contentTypeToFrontend(apiItem.content?.type),
    cropSettings: apiItem.content?.cropSettings,
  };
}

/**
 * Transform API content response to frontend format
 */
export function apiToFrontendContent(apiContent: ApiContentResponse) {
  // Get thumbnail URL - for YouTube, check metadata first
  let thumbnailUrl = apiContent.thumbnailUrl;
  
  // For YouTube content, also check metadata
  if (apiContent.type === 'YOUTUBE' && !thumbnailUrl && apiContent.metadata?.thumbnailUrl) {
    thumbnailUrl = apiContent.metadata.thumbnailUrl;
  }
  
  // Fallback to getThumbnailUrl function
  if (!thumbnailUrl) {
    thumbnailUrl = getThumbnailUrl(apiContent);
  }
  
  
  return {
    id: apiContent.id,
    name: apiContent.name,
    type: apiContent.type.toLowerCase(), // Keep original type, just lowercase
    filePath: apiContent.filePath,
    thumbnailUrl,
    metadata: apiContent.metadata,
    backgroundColor: apiContent.backgroundColor,
    cropSettings: apiContent.cropSettings,
    fileSize: apiContent.fileSize,
    mimeType: apiContent.mimeType,
    originalName: apiContent.originalName,
    processingStatus: apiContent.processingStatus,
    createdAt: new Date(apiContent.createdAt),
    updatedAt: new Date(apiContent.updatedAt),
    description: apiContent.description,
    duration: apiContent.duration,
  };
}

/**
 * Transform API display response to frontend format
 */
export function apiToFrontendDisplay(apiDisplay: ApiDisplayResponse) {
  // Determine status based on isOnline and lastSeen
  let status: 'online' | 'offline' | 'unknown' = 'unknown';
  if (apiDisplay.isOnline !== undefined) {
    status = apiDisplay.isOnline ? 'online' : 'offline';
  }
  
  return {
    id: apiDisplay.id,
    name: apiDisplay.name,
    uniqueUrl: apiDisplay.urlSlug, // Map urlSlug to uniqueUrl
    urlSlug: apiDisplay.urlSlug,
    playlistId: apiDisplay.playlistId,
    playlist: apiDisplay.playlist ? apiToFrontendPlaylist(apiDisplay.playlist) : undefined,
    resolution: apiDisplay.resolution || '1920x1080',
    orientation: (apiDisplay.orientation ? apiDisplay.orientation.toUpperCase() : 'LANDSCAPE') as 'LANDSCAPE' | 'PORTRAIT',
    lastSeen: apiDisplay.lastSeen ? new Date(apiDisplay.lastSeen) : null,
    isOnline: apiDisplay.isOnline,
    isActive: apiDisplay.isActive !== undefined ? apiDisplay.isActive : true,
    status: status,
    location: apiDisplay.location,
    createdAt: new Date(apiDisplay.createdAt),
    updatedAt: new Date(apiDisplay.updatedAt),
  };
}

/**
 * Transform API user response to frontend format
 */
export function apiToFrontendUser(apiUser: ApiUserResponse) {
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    fullName: [apiUser.firstName, apiUser.lastName].filter(Boolean).join(' ') || apiUser.username,
  };
}

// ============================================
// Frontend to API Transformers
// ============================================

/**
 * Transform frontend Playlist to API create request
 */
export function frontendToApiCreatePlaylist(playlist: Playlist): CreatePlaylistRequest {
  return {
    name: playlist.name,
    description: playlist.description,
    isActive: playlist.isActive,
    items: playlist.items.map((item, index) => ({
      contentId: item.contentId,
      order: index,
      duration: item.duration,
      transitionType: transitionEffectToType(item.transition),
      transitionDuration: Math.round(item.transitionDuration * 1000), // seconds to ms
    })),
    tags: playlist.tags,
  };
}

/**
 * Transform frontend Playlist to API update request
 */
export function frontendToApiUpdatePlaylist(playlist: Playlist): UpdatePlaylistRequest {
  return {
    name: playlist.name,
    description: playlist.description,
    isActive: playlist.isActive,
    items: playlist.items.map((item, index) => ({
      contentId: item.contentId,
      order: index,
      duration: item.duration,
      transitionType: transitionEffectToType(item.transition),
      transitionDuration: Math.round(item.transitionDuration * 1000), // seconds to ms
    })),
    tags: playlist.tags,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert database TransitionType enum to frontend TransitionEffect
 */
function transitionTypeToEffect(type: TransitionType | string): TransitionEffect {
  const typeMap: Record<string, TransitionEffect> = {
    'CUT': 'cut',
    'FADE': 'fade',
    'CROSSFADE': 'crossfade',
    'DISSOLVE': 'dissolve',
    'WIPE': 'wipe',
    'ZOOM': 'zoom',
    'PUSH': 'push',
    'SLIDE_OVER': 'slide-over',
    'IRIS': 'iris',
    'MORPH': 'morph',
    'BURN': 'burn',
    'BARN_DOORS': 'barn-doors',
    'PAGE_ROLL': 'page-roll',
    'PEEL': 'peel',
  };
  
  const upperType = (typeof type === 'string' ? type : type.toString()).toUpperCase();
  return typeMap[upperType] || 'fade';
}

/**
 * Convert frontend TransitionEffect to database TransitionType
 */
function transitionEffectToType(effect: TransitionEffect): string {
  const effectMap: Record<TransitionEffect, string> = {
    'cut': 'CUT',
    'fade': 'FADE',
    'crossfade': 'CROSSFADE',
    'dissolve': 'DISSOLVE',
    'wipe': 'WIPE',
    'zoom': 'ZOOM',
    'push': 'PUSH',
    'slide-over': 'SLIDE_OVER',
    'iris': 'IRIS',
    'morph': 'MORPH',
    'burn': 'BURN',
    'barn-doors': 'BARN_DOORS',
    'page-roll': 'PAGE_ROLL',
    'peel': 'PEEL',
  };
  
  return effectMap[effect] || 'FADE';
}

/**
 * Convert database ContentType to frontend format
 */
function contentTypeToFrontend(type?: ContentType | string): 'image' | 'video' | 'pdf' {
  if (!type) return 'image';
  
  const typeStr = (typeof type === 'string' ? type : type.toString()).toUpperCase();
  
  switch (typeStr) {
    case 'VIDEO':
      return 'video';
    case 'PDF':
      return 'pdf';
    case 'IMAGE':
    default:
      return 'image';
  }
}

/**
 * Get thumbnail URL from content
 */
function getThumbnailUrl(content?: ApiContentResponse): string | undefined {
  if (!content) return undefined;
  
  // Try to get from thumbnailUrl field
  if (content.thumbnailUrl) {
    return content.thumbnailUrl;
  }
  
  // Try to get from thumbnails array - prioritize display thumbnails
  if (content.thumbnails && content.thumbnails.length > 0) {
    // First try to find display thumbnail (16:9 with background)
    const displayThumb = content.thumbnails.find(t => t.size === 'display');
    // Fallback to medium thumbnail if display not found
    const mediumThumb = content.thumbnails.find(t => t.size === 'medium');
    const thumbnail = displayThumb || mediumThumb || content.thumbnails[0];
    
    if (thumbnail?.filePath) {
      // Check if it's an external URL (for YouTube thumbnails)
      if (thumbnail.filePath.startsWith('http://') || thumbnail.filePath.startsWith('https://')) {
        return thumbnail.filePath;
      }
      // Handle absolute paths and convert to relative URLs
      if (thumbnail.filePath.includes('/uploads/')) {
        const uploadsIndex = thumbnail.filePath.indexOf('/uploads/');
        const relativePath = thumbnail.filePath.substring(uploadsIndex + '/uploads/'.length);
        return `/uploads/${relativePath}`;
      } else if (thumbnail.filePath.startsWith('/uploads')) {
        return thumbnail.filePath;
      } else if (thumbnail.filePath.startsWith('uploads/')) {
        const relativePath = thumbnail.filePath.replace(/^uploads\//, '');
        return `/uploads/${relativePath}`;
      } else {
        const relativePath = thumbnail.filePath.replace(/^\.\/uploads\//, '').replace(/^\.\//, '');
        return `/uploads/${relativePath}`;
      }
    }
  }
  
  // For images, use the file path directly (but ensure proper URL format)
  if (content.type === 'IMAGE' && content.filePath) {
    if (content.filePath.startsWith('http://') || content.filePath.startsWith('https://')) {
      return content.filePath;
    }
    if (content.filePath.includes('/uploads/')) {
      const uploadsIndex = content.filePath.indexOf('/uploads/');
      const relativePath = content.filePath.substring(uploadsIndex + '/uploads/'.length);
      return `/uploads/${relativePath}`;
    } else if (content.filePath.startsWith('/uploads')) {
      return content.filePath;
    } else if (content.filePath.startsWith('uploads/')) {
      const relativePath = content.filePath.replace(/^uploads\//, '');
      return `/uploads/${relativePath}`;
    } else {
      const relativePath = content.filePath.replace(/^\.\/uploads\//, '').replace(/^\.\//, '');
      return `/uploads/${relativePath}`;
    }
  }
  
  return undefined;
}

/**
 * Calculate total duration from playlist items
 */
function calculateTotalDuration(items: ApiPlaylistItemResponse[]): number {
  return items.reduce((total, item) => total + item.duration, 0);
}

// ============================================
// Database to API Transformers
// ============================================

/**
 * Transform database playlist to API response format
 * Converts Date objects to ISO strings for JSON serialization
 */
export function databaseToApiPlaylist(dbPlaylist: any): ApiPlaylistResponse {
  return {
    id: dbPlaylist.id,
    name: dbPlaylist.name,
    description: dbPlaylist.description || undefined,
    createdBy: dbPlaylist.createdBy,
    isActive: dbPlaylist.isActive,
    createdAt: dbPlaylist.createdAt.toISOString(),
    updatedAt: dbPlaylist.updatedAt.toISOString(),
    items: dbPlaylist.items?.map(databaseToApiPlaylistItem),
    creator: dbPlaylist.creator ? databaseToApiUser(dbPlaylist.creator) : undefined,
    displays: dbPlaylist.displays?.map((d: any) => ({
      id: d.id,
      name: d.name,
      urlSlug: d.urlSlug,
    })),
    tags: dbPlaylist.tags?.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
    })),
    sharedWith: dbPlaylist.sharedWith?.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
    })),
  };
}

/**
 * Transform database playlist item to API response format
 */
function databaseToApiPlaylistItem(dbItem: any): ApiPlaylistItemResponse {
  return {
    id: dbItem.id,
    playlistId: dbItem.playlistId,
    contentId: dbItem.contentId,
    order: dbItem.order,
    duration: dbItem.duration,
    transitionType: dbItem.transitionType,
    transitionDuration: dbItem.transitionDuration,
    createdAt: dbItem.createdAt.toISOString(),
    updatedAt: dbItem.updatedAt.toISOString(),
    content: dbItem.content ? databaseToApiContent(dbItem.content) : undefined,
  };
}

/**
 * Transform database content to API response format
 */
export function databaseToApiContent(dbContent: any): ApiContentResponse {
  // Process thumbnail URL
  let thumbnailUrl = undefined;
  
  // For YouTube content, use the thumbnail from metadata
  if (dbContent.type === 'YOUTUBE' && dbContent.metadata?.thumbnailUrl) {
    thumbnailUrl = dbContent.metadata.thumbnailUrl;
  }
  // For other content with thumbnails
  else if (dbContent.thumbnails && dbContent.thumbnails.length > 0) {
    // Use display thumbnail if available, otherwise use medium or first available
    const displayThumb = dbContent.thumbnails.find((t: any) => t.size === 'display');
    const mediumThumb = dbContent.thumbnails.find((t: any) => t.size === 'medium');
    const thumbnail = displayThumb || mediumThumb || dbContent.thumbnails[0];
    
    if (thumbnail?.filePath) {
      // Check if it's an external URL (for YouTube thumbnails stored in FileThumbnail)
      if (thumbnail.filePath.startsWith('http://') || thumbnail.filePath.startsWith('https://')) {
        thumbnailUrl = thumbnail.filePath;
      }
      // Handle absolute paths (e.g., /Users/sronnie/Documents/Coding/IsoDisplay/uploads/...)
      else if (thumbnail.filePath.includes('/uploads/')) {
        // Extract everything after '/uploads/' to get the relative path
        const uploadsIndex = thumbnail.filePath.indexOf('/uploads/');
        const relativePath = thumbnail.filePath.substring(uploadsIndex + '/uploads/'.length);
        thumbnailUrl = `/uploads/${relativePath}`;
      } else if (thumbnail.filePath.startsWith('/uploads')) {
        // If it starts with /uploads, it's already relative
        thumbnailUrl = thumbnail.filePath;
      } else if (thumbnail.filePath.startsWith('uploads/')) {
        // For paths that start with uploads/ (no leading slash)
        const relativePath = thumbnail.filePath.replace(/^uploads\//, '');
        thumbnailUrl = `/uploads/${relativePath}`;
      } else {
        // For any other path format
        const relativePath = thumbnail.filePath.replace(/^\.\/uploads\//, '').replace(/^\.\//, '');
        thumbnailUrl = `/uploads/${relativePath}`;
      }
    }
  }
  
  // Fallback: if no thumbnail found, use the file path directly for images
  if (!thumbnailUrl && dbContent.type === 'IMAGE' && dbContent.filePath) {
    thumbnailUrl = dbContent.filePath;
  }

  return {
    id: dbContent.id,
    name: dbContent.name,
    description: dbContent.description,
    fileName: dbContent.fileName,
    filePath: dbContent.filePath,
    fileSize: dbContent.fileSize?.toString() || null,
    type: dbContent.type,
    mimeType: dbContent.mimeType,
    metadata: dbContent.metadata,
    backgroundColor: dbContent.backgroundColor,
    cropSettings: dbContent.cropSettings,
    originalName: dbContent.originalName,
    fileHash: dbContent.fileHash,
    duration: dbContent.duration,
    processingStatus: dbContent.processingStatus,
    processingError: dbContent.processingError,
    storageLocation: dbContent.storageLocation,
    uploadedBy: dbContent.uploadedBy,
    createdBy: dbContent.createdBy,
    createdAt: dbContent.createdAt.toISOString(),
    updatedAt: dbContent.updatedAt.toISOString(),
    deletedAt: dbContent.deletedAt?.toISOString() || null,
    thumbnailUrl: thumbnailUrl,
    thumbnails: dbContent.thumbnails?.map((t: any) => ({
      id: t.id,
      contentId: t.contentId,
      filePath: t.filePath,
      size: t.size,
      fileSize: t.fileSize.toString(),
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

/**
 * Transform database user to API response format
 */
function databaseToApiUser(dbUser: any): ApiUserResponse {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
  };
}

/**
 * Transform database display to API response format
 */
export function databaseToApiDisplay(dbDisplay: any): ApiDisplayResponse {
  return {
    id: dbDisplay.id,
    name: dbDisplay.name,
    urlSlug: dbDisplay.urlSlug,
    resolution: dbDisplay.resolution,
    orientation: dbDisplay.orientation,
    location: dbDisplay.location,
    isActive: dbDisplay.isActive,
    playlistId: dbDisplay.playlistId,
    lastSeen: dbDisplay.lastSeen?.toISOString() || null,
    createdAt: dbDisplay.createdAt.toISOString(),
    updatedAt: dbDisplay.updatedAt.toISOString(),
    playlist: dbDisplay.playlist ? {
      id: dbDisplay.playlist.id,
      name: dbDisplay.playlist.name,
    } : undefined,
  };
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate API response has required fields
 */
export function validateApiPlaylistResponse(data: any): data is ApiPlaylistResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.isActive === 'boolean' &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string'
  );
}

/**
 * Validate frontend playlist has required fields
 */
export function validateFrontendPlaylist(data: any): data is Playlist {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    Array.isArray(data.items) &&
    typeof data.totalDuration === 'number' &&
    typeof data.isActive === 'boolean'
  );
}