'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Display } from '@/types/display';
import { Playlist, PlaylistItem } from '@/types/playlist';
import { getPerformanceOptimizer } from '@/lib/performance/pi-optimizations';
import { useDisplayWebSocket } from '@/hooks/useWebSocket';
import type { 
  PlaylistUpdateMessage, 
  DisplayControlMessage, 
  EmergencyStopMessage 
} from '@/lib/services/websocket-service';

interface LightweightDisplayPlayerProps {
  display: Display;
  playlist: Playlist;
  lightweightMode?: boolean;
}

interface LightweightConfig {
  disableTransitions: boolean;
  reduceAnimations: boolean;
  simplifyRendering: boolean;
  lowMemoryMode: boolean;
  reducedQuality: boolean;
  minimalUI: boolean;
}

export function LightweightDisplayPlayer({ 
  display, 
  playlist: initialPlaylist, 
  lightweightMode = true 
}: LightweightDisplayPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentItem, setCurrentItem] = useState<PlaylistItem | null>(null);
  const [playlist, setPlaylist] = useState<Playlist>(initialPlaylist);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [frameDrops, setFrameDrops] = useState(0);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const performanceOptimizer = useRef(getPerformanceOptimizer());
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());

  // Lightweight configuration based on device capabilities
  const [config, setConfig] = useState<LightweightConfig>({
    disableTransitions: lightweightMode,
    reduceAnimations: lightweightMode,
    simplifyRendering: lightweightMode,
    lowMemoryMode: lightweightMode,
    reducedQuality: lightweightMode,
    minimalUI: lightweightMode
  });

  // Initialize WebSocket connection with reduced frequency for Pi
  const { 
    isConnected, 
    connectionStatus: wsStatus, 
    lastMessage, 
    sendStatusUpdate 
  } = useDisplayWebSocket(display.id, display.uniqueUrl, {
    heartbeatInterval: lightweightMode ? 30000 : 10000, // Less frequent heartbeats
    reconnectAttempts: lightweightMode ? 3 : 5,
    reconnectDelay: lightweightMode ? 5000 : 3000
  });

  // Monitor performance and adjust configuration
  useEffect(() => {
    const monitorPerformance = () => {
      const stats = performanceOptimizer.current.getPerformanceStats();
      setMemoryUsage(stats.cacheSizeMB);

      // Auto-adjust configuration based on performance
      if (stats.memory) {
        const memoryPressure = stats.memory.used / stats.memory.limit;
        
        if (memoryPressure > 0.8) {
          setConfig(prev => ({
            ...prev,
            lowMemoryMode: true,
            reducedQuality: true,
            disableTransitions: true
          }));
          console.warn('High memory pressure detected, enabling aggressive optimizations');
        } else if (memoryPressure < 0.5) {
          setConfig(prev => ({
            ...prev,
            lowMemoryMode: false,
            reducedQuality: lightweightMode,
            disableTransitions: lightweightMode
          }));
        }
      }

      // Monitor frame rate
      const now = performance.now();
      const timeDelta = now - lastFrameTimeRef.current;
      if (timeDelta > 1000) { // Check every second
        const fps = (frameCountRef.current * 1000) / timeDelta;
        if (fps < 25 && !config.reduceAnimations) {
          setFrameDrops(prev => prev + 1);
          if (frameDrops > 3) {
            setConfig(prev => ({
              ...prev,
              reduceAnimations: true,
              disableTransitions: true
            }));
            console.warn('Low frame rate detected, enabling performance mode');
          }
        }
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
      frameCountRef.current++;
    };

    const interval = setInterval(monitorPerformance, 1000);
    return () => clearInterval(interval);
  }, [lightweightMode, config.reduceAnimations, frameDrops]);

  // Apply CSS optimizations for lightweight mode
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'lightweight-optimizations';
    
    style.textContent = `
      /* Lightweight display optimizations */
      .lightweight-player {
        image-rendering: ${config.reducedQuality ? 'pixelated' : 'auto'};
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      .lightweight-player * {
        ${config.disableTransitions ? 'transition: none !important;' : ''}
        ${config.reduceAnimations ? 'animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;' : ''}
      }
      
      .lightweight-content {
        will-change: auto;
        contain: ${config.simplifyRendering ? 'layout style paint' : 'none'};
      }
      
      .lightweight-image {
        image-rendering: ${config.reducedQuality ? 'crisp-edges' : 'auto'};
        max-width: 100%;
        max-height: 100%;
        object-fit: ${config.simplifyRendering ? 'fill' : 'contain'};
      }
      
      .lightweight-video {
        ${config.lowMemoryMode ? 'poster: ""; preload: "none";' : ''}
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('lightweight-optimizations');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [config]);

  // Update connection status
  useEffect(() => {
    setConnectionStatus(wsStatus);
  }, [wsStatus]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'playlist_update':
        const playlistMsg = lastMessage as PlaylistUpdateMessage;
        if (playlistMsg.data.displayIds.includes(display.id)) {
          console.log('Received playlist update:', playlistMsg.data.playlist);
          setPlaylist(playlistMsg.data.playlist);
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
          console.log('Emergency stop received:', stopMsg.data.reason);
          setIsPlaying(false);
          sendStatusUpdate('paused', currentIndex);
        }
        break;
    }
  }, [lastMessage, display.id, currentIndex, sendStatusUpdate]);

  // Move to next item function - optimized for Pi
  const moveToNextItem = useCallback(() => {
    if (playlist.items.length === 0) return;

    const nextIndex = (currentIndex + 1) % playlist.items.length;
    
    // Immediate transition in lightweight mode
    if (config.disableTransitions) {
      setCurrentIndex(nextIndex);
      setCurrentItem(playlist.items[nextIndex]);
      sendStatusUpdate(isPlaying ? 'playing' : 'paused', nextIndex);
    } else {
      // Minimal transition
      const transitionDuration = Math.min(currentItem?.transitionDuration || 1, 0.5);
      
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setCurrentItem(playlist.items[nextIndex]);
        sendStatusUpdate(isPlaying ? 'playing' : 'paused', nextIndex);
      }, transitionDuration * 1000);
    }
  }, [currentIndex, currentItem, playlist.items, isPlaying, sendStatusUpdate, config.disableTransitions]);

  // Handle remote control commands
  const handleRemoteControl = useCallback((action: string, value?: number) => {
    console.log('Remote control command:', action, value);
    
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
        moveToNextItem();
        break;
      case 'previous':
        const prevIndex = currentIndex === 0 ? playlist.items.length - 1 : currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentItem(playlist.items[prevIndex]);
        sendStatusUpdate(isPlaying ? 'playing' : 'paused', prevIndex);
        break;
      case 'seek':
        if (typeof value === 'number' && value >= 0 && value < playlist.items.length) {
          setCurrentIndex(value);
          setCurrentItem(playlist.items[value]);
          sendStatusUpdate(isPlaying ? 'playing' : 'paused', value);
        }
        break;
      case 'toggle_lightweight':
        setConfig(prev => ({
          disableTransitions: !prev.disableTransitions,
          reduceAnimations: !prev.reduceAnimations,
          simplifyRendering: !prev.simplifyRendering,
          lowMemoryMode: !prev.lowMemoryMode,
          reducedQuality: !prev.reducedQuality,
          minimalUI: !prev.minimalUI
        }));
        break;
    }
  }, [currentIndex, playlist.items, isPlaying, sendStatusUpdate, moveToNextItem]);

  // Initialize first item
  useEffect(() => {
    if (playlist.items.length > 0) {
      setCurrentItem(playlist.items[0]);
    }
  }, [playlist]);

  // Start playback timer
  useEffect(() => {
    if (isPlaying && currentItem) {
      const duration = currentItem.duration * 1000;
      
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

  // Lightweight content renderer
  const renderLightweightContent = (item: PlaylistItem | null) => {
    if (!item) return null;

    const commonProps = {
      className: "lightweight-content w-full h-full"
    };

    switch (item.contentType) {
      case 'image':
        return (
          <img
            {...commonProps}
            className="lightweight-image w-full h-full"
            src={item.url}
            alt={item.title || 'Display content'}
            loading={config.lowMemoryMode ? 'lazy' : 'eager'}
            decoding={config.simplifyRendering ? 'sync' : 'async'}
            onLoad={() => frameCountRef.current++}
            onError={(e) => {
              console.error('Image load error:', e);
              // Fallback to low quality version or placeholder
            }}
          />
        );
      
      case 'video':
        return (
          <video
            {...commonProps}
            className="lightweight-video w-full h-full"
            src={item.url}
            autoPlay={isPlaying}
            muted
            loop={false}
            playsInline
            preload={config.lowMemoryMode ? 'none' : 'metadata'}
            onEnded={moveToNextItem}
            onLoadedData={() => frameCountRef.current++}
            style={{
              objectFit: config.simplifyRendering ? 'fill' : 'contain'
            }}
          />
        );
      
      case 'pdf':
        // Simplified PDF rendering for Pi
        return (
          <div {...commonProps} className="flex items-center justify-center text-white text-2xl">
            PDF: {item.title || 'Document'}
            <br />
            <small className="text-sm opacity-60">
              (Full PDF rendering disabled in lightweight mode)
            </small>
          </div>
        );
      
      default:
        return (
          <div {...commonProps} className="flex items-center justify-center text-white text-xl">
            {item.title || 'Unsupported content'}
          </div>
        );
    }
  };

  return (
    <div 
      ref={playerRef}
      className="lightweight-player min-h-screen bg-black relative overflow-hidden cursor-none"
    >
      {renderLightweightContent(currentItem)}

      {/* Minimal status indicator */}
      {config.minimalUI && connectionStatus !== 'connected' && (
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500"></div>
      )}

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && !config.minimalUI && (
        <div className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded text-xs space-y-1">
          <div>Mode: Lightweight</div>
          <div>Item: {currentIndex + 1}/{playlist.items.length}</div>
          <div>Memory: {memoryUsage}MB</div>
          <div>Drops: {frameDrops}</div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}></span>
            <span>{connectionStatus}</span>
          </div>
          <div className="text-xs opacity-60">
            Transitions: {config.disableTransitions ? 'OFF' : 'ON'}
            <br />
            Quality: {config.reducedQuality ? 'LOW' : 'HIGH'}
            <br />
            Memory: {config.lowMemoryMode ? 'LOW' : 'NORMAL'}
          </div>
        </div>
      )}
    </div>
  );
}

export default LightweightDisplayPlayer;