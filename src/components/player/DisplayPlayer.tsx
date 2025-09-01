'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Display } from '@/types/display';
import { Playlist, PlaylistItem } from '@/types/playlist';
import TransitionContainer from './TransitionContainer';
import { ImageRenderer } from './renderers/ImageRenderer';
import { VideoRenderer } from './renderers/VideoRenderer';
import VerticalVideoRenderer from './renderers/VerticalVideoRenderer';
import { PDFRenderer } from './renderers/PDFRenderer';
import { YouTubeRenderer } from './renderers/YouTubeRenderer';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useDisplayWebSocket } from '@/hooks/useWebSocket';
import { usePerformanceOptimization } from '@/lib/performance';
import { playlistCache } from '@/lib/services/playlist-cache';
import type {
  PlaylistUpdateMessage,
  DisplayControlMessage,
  EmergencyStopMessage,
} from '@/types/websocket';

interface DisplayPlayerProps {
  display: Display;
  playlist: Playlist;
}

export function DisplayPlayer({ display, playlist: initialPlaylist }: DisplayPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentItem, setCurrentItem] = useState<PlaylistItem | null>(null);
  const [nextItem, setNextItem] = useState<PlaylistItem | null>(null);
  const [playlist, setPlaylist] = useState<Playlist>(initialPlaylist);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const playerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const viewStartTimeRef = useRef<number>(Date.now());
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(playerRef);

  // Safety check - if no playlist provided, show error
  if (!initialPlaylist) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl mb-4">No Playlist Assigned</h2>
          <p className="text-gray-400">Please assign a playlist to this display from the admin interface.</p>
        </div>
      </div>
    );
  }

  // Performance optimization for Raspberry Pi
  const { metrics, quality, optimizer } = usePerformanceOptimization();

  // Initialize WebSocket connection
  const {
    connectionStatus: wsStatus,
    lastMessage,
    sendStatusUpdate,
  } = useDisplayWebSocket(display.id, display.uniqueUrl);

  // Update connection status and handle offline mode
  useEffect(() => {
    setConnectionStatus(wsStatus);

    // Load cached playlist if disconnected
    if (wsStatus === 'disconnected' || wsStatus === 'error') {
      const cachedPlaylist = playlistCache.getCachedPlaylist(display.id);
      if (cachedPlaylist && cachedPlaylist.id !== playlist.id) {
        setPlaylist(cachedPlaylist);
      }
    }
  }, [wsStatus, display.id, playlist.id]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'playlist_update':
        const playlistMsg = lastMessage as PlaylistUpdateMessage;
        if (playlistMsg.data.displayIds.includes(display.id)) {
          const newPlaylist = playlistMsg.data.playlist;
          setPlaylist(newPlaylist);
          // Cache the new playlist for offline use
          playlistCache.cachePlaylist(display.id, newPlaylist);
          // Reset to first item of new playlist
          setCurrentIndex(0);
        }
        break;

      case 'display_control':
        const controlMsg = lastMessage as DisplayControlMessage;
        if (controlMsg.data.displayId === display.id) {
          handleRemoteControl(controlMsg.data.action, controlMsg.data.value);
        }
        break;

      case 'emergency_stop':
        const stopMsg = lastMessage as EmergencyStopMessage;
        if (stopMsg.data.displayIds === 'all' || stopMsg.data.displayIds.includes(display.id)) {
          setIsPlaying(false);
          sendStatusUpdate('paused', currentIndex);
        }
        break;
    }
  }, [lastMessage, display.id, currentIndex, sendStatusUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track view analytics
  const trackView = useCallback(
    async (completed: boolean, skipped: boolean = false) => {
      if (!currentItem || !playlist) return;

      const viewDuration = Math.round((Date.now() - viewStartTimeRef.current) / 1000);

      try {
        await fetch('/api/tracking/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayId: display.id,
            playlistId: playlist.id,
            contentId: currentItem.contentId,
            duration: viewDuration,
            expectedDuration: currentItem.duration,
            completed,
            skipped,
          }),
        });
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    },
    [currentItem, display.id, playlist?.id]
  );

  // Move to next item function with performance optimization
  const moveToNextItem = useCallback(() => {
    if (!playlist || playlist.items.length === 0) return;

    // Track the current item view as completed
    trackView(true, false);

    const nextIndex = (currentIndex + 1) % playlist.items.length;

    // Clean up memory before transition
    optimizer.cleanupMemory();

    // Update to next item - keep current for transition
    setCurrentIndex(nextIndex);
    setCurrentItem(playlist.items[nextIndex]);

    // Reset view timer for new item
    viewStartTimeRef.current = Date.now();

    // Preload next items
    const followingIndex = (nextIndex + 1) % playlist.items.length;
    setNextItem(playlist.items[followingIndex]);

    // Preload upcoming content
    const preloadUrls = [];
    for (let i = 1; i <= 2; i++) {
      const idx = (nextIndex + i) % playlist.items.length;
      if (playlist.items[idx]?.content?.fileUrl) {
        preloadUrls.push(playlist.items[idx].content.fileUrl);
      }
    }
    optimizer.preloadContent(preloadUrls);

    // Send status update
    sendStatusUpdate(isPlaying ? 'playing' : 'paused', nextIndex);
  }, [currentIndex, playlist.items, isPlaying, sendStatusUpdate, optimizer, trackView]);

  // Handle remote control commands
  const handleRemoteControl = useCallback(
    (action: string, value?: number) => {
      switch (action) {
        case 'play':
          setIsPlaying(true);
          sendStatusUpdate('playing', currentIndex);
          break;
        case 'pause':
          setIsPlaying(false);
          sendStatusUpdate('paused', currentIndex);
          break;
        case 'stop':
          setIsPlaying(false);
          setCurrentIndex(0);
          setCurrentItem(playlist.items[0] || null);
          sendStatusUpdate('paused', 0);
          break;
        case 'restart':
          setCurrentIndex(0);
          setCurrentItem(playlist.items[0] || null);
          setIsPlaying(true);
          sendStatusUpdate('playing', 0);
          break;
        case 'next':
          // Track current item as skipped
          trackView(false, true);
          moveToNextItem();
          break;
        case 'previous':
          // Track current item as skipped
          trackView(false, true);
          const prevIndex = currentIndex === 0 ? playlist.items.length - 1 : currentIndex - 1;
          setCurrentIndex(prevIndex);
          setCurrentItem(playlist.items[prevIndex]);
          viewStartTimeRef.current = Date.now(); // Reset timer
          sendStatusUpdate(isPlaying ? 'playing' : 'paused', prevIndex);
          break;
        case 'seek':
          if (typeof value === 'number' && value >= 0 && value < playlist.items.length) {
            setCurrentIndex(value);
            setCurrentItem(playlist.items[value]);
            sendStatusUpdate(isPlaying ? 'playing' : 'paused', value);
          }
          break;
      }
    },
    [currentIndex, playlist.items, isPlaying, sendStatusUpdate, moveToNextItem, trackView]
  );

  // Initialize first item and preload content
  useEffect(() => {
    if (playlist.items.length > 0) {
      setCurrentItem(playlist.items[0]);
      if (playlist.items.length > 1) {
        setNextItem(playlist.items[1]);
      }

      // Cache playlist for offline use
      playlistCache.cachePlaylist(display.id, playlist);

      // Preload upcoming content for smooth transitions
      const preloadUrls = playlist.items
        .slice(0, 3)
        .map((item) => {
          // Skip YouTube content from preloading
          if (item.contentType === 'youtube') return null;
          // Check if content exists and has fileUrl
          return item.content?.fileUrl;
        })
        .filter(Boolean) as string[];

      if (preloadUrls.length > 0) {
        optimizer.preloadContent(preloadUrls);
      }
    }
  }, [playlist, optimizer, display.id]);

  // Start playback timer
  useEffect(() => {
    if (isPlaying && currentItem) {
      const duration = currentItem.duration * 1000; // Convert to milliseconds

      timerRef.current = setTimeout(() => {
        moveToNextItem();
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentItem, isPlaying, moveToNextItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'F11':
          e.preventDefault();
          if (!isFullscreen) {
            enterFullscreen();
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying((prev) => {
            const newState = !prev;
            sendStatusUpdate(newState ? 'playing' : 'paused', currentIndex);
            return newState;
          });
          break;
        case 'ArrowRight':
          trackView(false, true);
          moveToNextItem();
          break;
        case 'ArrowLeft':
          trackView(false, true);
          const prevIndex = currentIndex === 0 ? playlist.items.length - 1 : currentIndex - 1;
          setCurrentIndex(prevIndex);
          setCurrentItem(playlist.items[prevIndex]);
          viewStartTimeRef.current = Date.now();
          sendStatusUpdate(isPlaying ? 'playing' : 'paused', prevIndex);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    moveToNextItem,
    currentIndex,
    playlist.items,
    sendStatusUpdate,
    isPlaying,
    trackView,
  ]);

  const renderContent = (item: PlaylistItem | null) => {
    if (!item) return null;

    // Handle both lowercase and uppercase content types
    const contentType = item.contentType?.toLowerCase();

    switch (contentType) {
      case 'image':
        return <ImageRenderer item={item} />;
      case 'video':
        return <VerticalVideoRenderer item={item} isPlaying={isPlaying} onEnded={moveToNextItem} />;
      case 'pdf':
        return <PDFRenderer item={item} />;
      case 'youtube':
        return <YouTubeRenderer item={item} onEnded={moveToNextItem} />;
      default:
        return (
          <div className="flex items-center justify-center h-full bg-black">
            <div className="text-white text-2xl">Unsupported content type: {item.contentType}</div>
          </div>
        );
    }
  };

  return (
    <div
      ref={playerRef}
      className={`h-screen w-screen bg-black relative overflow-hidden cursor-none gpu-accelerated quality-${quality}`}
      onDoubleClick={enterFullscreen}
    >
      <TransitionContainer
        transition={currentItem?.transition || 'fade'}
        duration={currentItem?.transitionDuration || 1}
        contentKey={currentIndex}
      >
        {renderContent(currentItem)}
      </TransitionContainer>

      {/* Preload next item */}
      {nextItem && <div className="hidden">{renderContent(nextItem)}</div>}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded text-sm space-y-1">
          <div>Display: {display.name}</div>
          <div>
            Item: {currentIndex + 1}/{playlist.items.length}
          </div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
          <div>Fullscreen: {isFullscreen ? 'Yes' : 'No'}</div>
          <div className="flex items-center gap-2">
            <span>WebSocket:</span>
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-500'
                    : connectionStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-500'
              }`}
            ></span>
            <span className="text-xs">{connectionStatus}</span>
          </div>
          <div className="border-t border-white/20 mt-2 pt-2">
            <div>Quality: {quality}</div>
            <div>FPS: {metrics.fps}</div>
            <div>Memory: {metrics.memoryUsage}MB</div>
            <div>Frame Drops: {metrics.frameDrops}</div>
          </div>
        </div>
      )}

      {/* Connection status indicator for production */}
      {process.env.NODE_ENV === 'production' && connectionStatus !== 'connected' && (
        <div className="absolute top-4 right-4 text-white bg-red-500/80 p-2 rounded text-sm flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          {connectionStatus === 'disconnected' || connectionStatus === 'error'
            ? 'Offline Mode'
            : 'Connecting...'}
        </div>
      )}
    </div>
  );
}

export default DisplayPlayer;
