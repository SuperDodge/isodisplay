/**
 * Local playlist caching service for offline support
 */

import { Playlist } from '@/types/playlist';

const CACHE_KEY_PREFIX = 'isodisplay_playlist_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CachedPlaylist {
  playlist: Playlist;
  timestamp: number;
  displayId: string;
}

export class PlaylistCacheService {
  private static instance: PlaylistCacheService;

  private constructor() {}

  static getInstance(): PlaylistCacheService {
    if (!PlaylistCacheService.instance) {
      PlaylistCacheService.instance = new PlaylistCacheService();
    }
    return PlaylistCacheService.instance;
  }

  /**
   * Cache a playlist for a specific display
   */
  cachePlaylist(displayId: string, playlist: Playlist): void {
    try {
      const cacheData: CachedPlaylist = {
        playlist,
        timestamp: Date.now(),
        displayId
      };
      
      const key = `${CACHE_KEY_PREFIX}${displayId}`;
      localStorage.setItem(key, JSON.stringify(cacheData));
      
      // Also cache content URLs for offline use (if service worker is available)
      this.cacheContentUrls(playlist);
    } catch (error) {
      console.error('Failed to cache playlist:', error);
    }
  }

  /**
   * Retrieve a cached playlist for a display
   */
  getCachedPlaylist(displayId: string): Playlist | null {
    try {
      const key = `${CACHE_KEY_PREFIX}${displayId}`;
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        return null;
      }
      
      const cacheData: CachedPlaylist = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
        this.clearCachedPlaylist(displayId);
        return null;
      }
      
      return cacheData.playlist;
    } catch (error) {
      console.error('Failed to retrieve cached playlist:', error);
      return null;
    }
  }

  /**
   * Clear cached playlist for a display
   */
  clearCachedPlaylist(displayId: string): void {
    try {
      const key = `${CACHE_KEY_PREFIX}${displayId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear cached playlist:', error);
    }
  }

  /**
   * Clear all cached playlists
   */
  clearAllCachedPlaylists(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear all cached playlists:', error);
    }
  }

  /**
   * Get all cached display IDs
   */
  getCachedDisplayIds(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(CACHE_KEY_PREFIX))
        .map(key => key.replace(CACHE_KEY_PREFIX, ''));
    } catch (error) {
      console.error('Failed to get cached display IDs:', error);
      return [];
    }
  }

  /**
   * Cache content URLs for offline use with service worker
   */
  private async cacheContentUrls(playlist: Playlist): Promise<void> {
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      return;
    }

    try {
      const urls = playlist.items
        .map(item => item.content?.fileUrl)
        .filter(Boolean) as string[];

      // Send message to service worker to cache these URLs
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_PLAYLIST_CONTENT',
          urls
        });
      }
    } catch (error) {
      console.error('Failed to cache content URLs:', error);
    }
  }

  /**
   * Check if we have offline support
   */
  hasOfflineSupport(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Get cache size information
   */
  async getCacheInfo(): Promise<{ used: number; available: number } | null> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0
      };
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return null;
    }
  }
}

export const playlistCache = PlaylistCacheService.getInstance();