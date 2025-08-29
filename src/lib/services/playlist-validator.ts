import { prisma } from '@/lib/prisma';
import { Playlist, PlaylistItem } from '@/types/playlist';
import { promises as fs } from 'fs';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalItems: number;
    validItems: number;
    missingContent: number;
    totalDuration: number;
  };
}

export interface ValidationError {
  type: 'MISSING_CONTENT' | 'INVALID_DURATION' | 'EMPTY_PLAYLIST' | 'INVALID_TRANSITION';
  itemId?: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  type: 'SHORT_DURATION' | 'LONG_DURATION' | 'MISSING_THUMBNAIL' | 'UNSUPPORTED_FORMAT';
  itemId?: string;
  message: string;
}

class PlaylistValidator {
  // Validate entire playlist
  async validatePlaylist(playlistId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Fetch playlist with items and content
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
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
    });

    if (!playlist) {
      return {
        isValid: false,
        errors: [{
          type: 'EMPTY_PLAYLIST',
          message: 'Playlist not found',
          severity: 'critical',
        }],
        warnings: [],
        summary: {
          totalItems: 0,
          validItems: 0,
          missingContent: 0,
          totalDuration: 0,
        },
      };
    }

    // Check if playlist is empty
    if (!playlist.items || playlist.items.length === 0) {
      errors.push({
        type: 'EMPTY_PLAYLIST',
        message: 'Playlist has no items',
        severity: 'error',
      });
    }

    let validItems = 0;
    let missingContent = 0;
    let totalDuration = 0;

    // Validate each item
    for (const item of playlist.items) {
      const itemErrors = await this.validatePlaylistItem(item);
      const itemWarnings = await this.getItemWarnings(item);

      if (itemErrors.length === 0) {
        validItems++;
        totalDuration += item.duration;
      } else {
        if (itemErrors.some(e => e.type === 'MISSING_CONTENT')) {
          missingContent++;
        }
      }

      errors.push(...itemErrors);
      warnings.push(...itemWarnings);
    }

    // Check total duration
    if (totalDuration < 5 && playlist.items.length > 0) {
      warnings.push({
        type: 'SHORT_DURATION',
        message: 'Playlist total duration is very short (< 5 seconds)',
      });
    } else if (totalDuration > 3600) {
      warnings.push({
        type: 'LONG_DURATION',
        message: 'Playlist duration exceeds 1 hour',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalItems: playlist.items.length,
        validItems,
        missingContent,
        totalDuration,
      },
    };
  }

  // Validate individual playlist item
  private async validatePlaylistItem(item: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check if content exists
    if (!item.content) {
      errors.push({
        type: 'MISSING_CONTENT',
        itemId: item.id,
        message: `Content not found for item ${item.order + 1}`,
        severity: 'error',
      });
      return errors;
    }

    // Validate duration
    if (!item.duration || item.duration <= 0) {
      errors.push({
        type: 'INVALID_DURATION',
        itemId: item.id,
        message: `Invalid duration for item ${item.order + 1}`,
        severity: 'error',
      });
    }

    // Validate transition
    const validTransitions = [
      'cut', 'fade', 'crossfade', 'dissolve', 'wipe', 'zoom',
      'push', 'slide-over', 'iris', 'morph', 'burn',
      'barn-doors', 'page-roll', 'peel'
    ];

    if (item.transition && !validTransitions.includes(item.transition)) {
      errors.push({
        type: 'INVALID_TRANSITION',
        itemId: item.id,
        message: `Invalid transition type: ${item.transition}`,
        severity: 'error',
      });
    }

    // Check file existence (if file path is stored)
    if (item.content.filePath) {
      const fileExists = await this.checkFileExists(item.content.filePath);
      if (!fileExists) {
        errors.push({
          type: 'MISSING_CONTENT',
          itemId: item.id,
          message: `File not found: ${item.content.filePath}`,
          severity: 'critical',
        });
      }
    }

    return errors;
  }

  // Get warnings for playlist item
  private async getItemWarnings(item: any): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // Check for missing thumbnail
    if (!item.content?.thumbnail) {
      warnings.push({
        type: 'MISSING_THUMBNAIL',
        itemId: item.id,
        message: `No thumbnail for item ${item.order + 1}`,
      });
    }

    // Check duration warnings
    if (item.duration < 3) {
      warnings.push({
        type: 'SHORT_DURATION',
        itemId: item.id,
        message: `Very short duration (${item.duration}s) for item ${item.order + 1}`,
      });
    } else if (item.duration > 300) {
      warnings.push({
        type: 'LONG_DURATION',
        itemId: item.id,
        message: `Very long duration (${item.duration}s) for item ${item.order + 1}`,
      });
    }

    // Check for unsupported formats (example)
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'];
    if (item.content?.mimeType && !supportedFormats.includes(item.content.mimeType)) {
      warnings.push({
        type: 'UNSUPPORTED_FORMAT',
        itemId: item.id,
        message: `Potentially unsupported format: ${item.content.mimeType}`,
      });
    }

    return warnings;
  }

  // Check if file exists
  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      // Check if file exists in the public uploads directory
      // Construct the full path
      const publicPath = path.join(process.cwd(), 'public', filePath);
      
      // Check if file exists
      await fs.access(publicPath);
      return true;
    } catch {
      return false;
    }
  }

  // Fix playlist issues
  async fixPlaylistIssues(
    playlistId: string,
    options: {
      removeMissing?: boolean;
      fixDurations?: boolean;
      fixTransitions?: boolean;
    } = {}
  ): Promise<{ fixed: boolean; changes: string[] }> {
    const changes: string[] = [];
    const validation = await this.validatePlaylist(playlistId);

    if (validation.isValid) {
      return { fixed: true, changes: ['No issues found'] };
    }

    // Remove items with missing content
    if (options.removeMissing) {
      const missingItems = validation.errors
        .filter(e => e.type === 'MISSING_CONTENT' && e.itemId)
        .map(e => e.itemId);

      if (missingItems.length > 0) {
        await prisma.playlistItem.deleteMany({
          where: {
            id: { in: missingItems as string[] },
            playlistId,
          },
        });
        changes.push(`Removed ${missingItems.length} items with missing content`);
      }
    }

    // Fix invalid durations
    if (options.fixDurations) {
      const invalidDurations = validation.errors
        .filter(e => e.type === 'INVALID_DURATION' && e.itemId)
        .map(e => e.itemId);

      if (invalidDurations.length > 0) {
        await prisma.playlistItem.updateMany({
          where: {
            id: { in: invalidDurations as string[] },
            playlistId,
          },
          data: {
            duration: 10, // Default duration
          },
        });
        changes.push(`Fixed ${invalidDurations.length} items with invalid durations`);
      }
    }

    // Fix invalid transitions
    if (options.fixTransitions) {
      const invalidTransitions = validation.errors
        .filter(e => e.type === 'INVALID_TRANSITION' && e.itemId)
        .map(e => e.itemId);

      if (invalidTransitions.length > 0) {
        await prisma.playlistItem.updateMany({
          where: {
            id: { in: invalidTransitions as string[] },
            playlistId,
          },
          data: {
            transition: 'fade', // Default transition
          },
        });
        changes.push(`Fixed ${invalidTransitions.length} items with invalid transitions`);
      }
    }

    // Re-order items after deletions
    const remainingItems = await prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { order: 'asc' },
    });

    for (let i = 0; i < remainingItems.length; i++) {
      if (remainingItems[i].order !== i) {
        await prisma.playlistItem.update({
          where: { id: remainingItems[i].id },
          data: { order: i },
        });
      }
    }

    return {
      fixed: changes.length > 0,
      changes,
    };
  }

  // Validate multiple playlists
  async validateMultiplePlaylists(playlistIds: string[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const id of playlistIds) {
      const result = await this.validatePlaylist(id);
      results.set(id, result);
    }

    return results;
  }
}

export const playlistValidator = new PlaylistValidator();