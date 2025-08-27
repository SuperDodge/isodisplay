'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  PlayerState, 
  PlayerAction, 
  PlayerStateManager, 
  PlayerStatus, 
  RepeatMode, 
  PlaybackSpeed,
  initialPlayerState 
} from '@/lib/state/player-state';

export function usePlayerState(autoSave: boolean = true) {
  const managerRef = useRef<PlayerStateManager | null>(null);
  const [state, setState] = useState<PlayerState>(initialPlayerState);

  // Initialize state manager
  useEffect(() => {
    managerRef.current = new PlayerStateManager();
    
    // Load from storage if autoSave is enabled
    if (autoSave) {
      managerRef.current.loadFromStorage();
    }
    
    // Subscribe to state changes
    const unsubscribe = managerRef.current.subscribe((newState) => {
      setState(newState);
      
      // Auto-save if enabled
      if (autoSave) {
        managerRef.current?.saveToStorage();
      }
    });

    // Set initial state
    setState(managerRef.current.getState());

    return () => {
      unsubscribe();
    };
  }, [autoSave]);

  // Action dispatchers
  const actions = {
    play: useCallback(() => managerRef.current?.play(), []),
    pause: useCallback(() => managerRef.current?.pause(), []),
    stop: useCallback(() => managerRef.current?.stop(), []),
    next: useCallback(() => managerRef.current?.next(), []),
    previous: useCallback(() => managerRef.current?.previous(), []),
    seek: useCallback((time: number) => managerRef.current?.seek(time), []),
    seekToIndex: useCallback((index: number) => managerRef.current?.seekToIndex(index), []),
    setVolume: useCallback((volume: number) => managerRef.current?.setVolume(volume), []),
    toggleMute: useCallback(() => managerRef.current?.toggleMute(), []),
    setSpeed: useCallback((speed: PlaybackSpeed) => managerRef.current?.setSpeed(speed), []),
    setRepeatMode: useCallback((mode: RepeatMode) => managerRef.current?.setRepeatMode(mode), []),
    toggleShuffle: useCallback(() => managerRef.current?.toggleShuffle(), []),
    toggleFullscreen: useCallback(() => managerRef.current?.toggleFullscreen(), []),
    loadPlaylist: useCallback((playlistId: string, totalItems: number) => 
      managerRef.current?.loadPlaylist(playlistId, totalItems), []),
    updateProgress: useCallback((currentTime: number, duration: number) => 
      managerRef.current?.updateProgress(currentTime, duration), []),
    setStatus: useCallback((status: PlayerStatus) => managerRef.current?.setStatus(status), []),
    setCurrentItem: useCallback((index: number, itemId: string) => 
      managerRef.current?.setCurrentItem(index, itemId), []),
    setError: useCallback((error: string) => managerRef.current?.setError(error), []),
    clearError: useCallback(() => managerRef.current?.clearError(), []),
    setLoadingProgress: useCallback((progress: number) => 
      managerRef.current?.setLoadingProgress(progress), []),
    addPreloaded: useCallback((itemId: string) => managerRef.current?.addPreloaded(itemId), []),
    removePreloaded: useCallback((itemId: string) => managerRef.current?.removePreloaded(itemId), []),
    setBufferedTime: useCallback((time: number) => managerRef.current?.setBufferedTime(time), []),
    enableRemoteControl: useCallback((enabled: boolean) => 
      managerRef.current?.enableRemoteControl(enabled), []),
    enableKeyboardControl: useCallback((enabled: boolean) => 
      managerRef.current?.enableKeyboardControl(enabled), []),
    setAutoplay: useCallback((enabled: boolean) => managerRef.current?.setAutoplay(enabled), []),
    reset: useCallback(() => managerRef.current?.reset(), [])
  };

  // Computed properties
  const computed = {
    canPlay: managerRef.current?.canPlay ?? false,
    canGoNext: managerRef.current?.canGoNext ?? false,
    canGoPrevious: managerRef.current?.canGoPrevious ?? false,
    hasPlaylist: managerRef.current?.hasPlaylist ?? false,
    isBuffering: managerRef.current?.isBuffering ?? false,
    playbackInfo: managerRef.current?.playbackInfo ?? '0 / 0 • 0:00 / 0:00'
  };

  return {
    state,
    actions,
    computed
  };
}

// Hook for keyboard controls
export function usePlayerKeyboardControls(
  actions: ReturnType<typeof usePlayerState>['actions'],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if typing in input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          // Toggle play/pause
          actions.play(); // This will handle the toggle logic
          break;
        
        case 'ArrowRight':
          event.preventDefault();
          if (event.shiftKey) {
            // Seek forward 30 seconds
            // Will need current time from state
          } else {
            actions.next();
          }
          break;
        
        case 'ArrowLeft':
          event.preventDefault();
          if (event.shiftKey) {
            // Seek backward 30 seconds
          } else {
            actions.previous();
          }
          break;
        
        case 'ArrowUp':
          event.preventDefault();
          // Volume up
          // Will need current volume from state
          break;
        
        case 'ArrowDown':
          event.preventDefault();
          // Volume down
          break;
        
        case 'KeyM':
          event.preventDefault();
          actions.toggleMute();
          break;
        
        case 'KeyF':
          event.preventDefault();
          actions.toggleFullscreen();
          break;
        
        case 'KeyR':
          event.preventDefault();
          if (event.shiftKey) {
            actions.toggleShuffle();
          } else {
            // Cycle repeat mode
          }
          break;
        
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const speeds: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5];
            const index = parseInt(event.code.slice(-1)) - 1;
            if (speeds[index]) {
              actions.setSpeed(speeds[index]);
            }
          }
          break;
        
        case 'Escape':
          event.preventDefault();
          actions.stop();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions, enabled]);
}

// Hook for automatic progress tracking
export function usePlayerProgressTracking(
  actions: ReturnType<typeof usePlayerState>['actions'],
  getCurrentTime: () => number,
  getDuration: () => number,
  isPlaying: boolean
) {
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentTime = getCurrentTime();
      const duration = getDuration();
      
      if (duration > 0) {
        actions.updateProgress(currentTime, duration);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isPlaying, actions, getCurrentTime, getDuration]);
}

// Hook for automatic item advancement
export function usePlayerAutoAdvance(
  actions: ReturnType<typeof usePlayerState>['actions'],
  state: PlayerState,
  getCurrentTime: () => number,
  getDuration: () => number
) {
  useEffect(() => {
    if (!state.isPlaying || !state.autoplay) return;

    const checkAdvance = () => {
      const currentTime = getCurrentTime();
      const duration = getDuration();
      
      // Advance when current item ends (with small buffer)
      if (duration > 0 && currentTime >= duration - 0.5) {
        if (state.repeatMode === 'single') {
          actions.seek(0); // Restart current item
        } else if (state.canGoNext) {
          actions.next();
        } else if (state.repeatMode === 'all') {
          actions.seekToIndex(0); // Restart playlist
        } else {
          actions.pause(); // Stop at end if no repeat
        }
      }
    };

    const interval = setInterval(checkAdvance, 500); // Check twice per second
    return () => clearInterval(interval);
  }, [state.isPlaying, state.autoplay, state.repeatMode, state.canGoNext, actions, getCurrentTime, getDuration]);
}

// Hook for player analytics
export function usePlayerAnalytics(state: PlayerState) {
  const [analytics, setAnalytics] = useState({
    sessionDuration: 0,
    itemsPlayed: 0,
    totalWatchTime: 0,
    averageWatchTime: 0,
    errorRate: 0,
    bufferingTime: 0,
    lastActivity: Date.now()
  });

  useEffect(() => {
    const sessionDuration = (Date.now() - state.sessionStartTime) / 1000;
    const itemsPlayed = state.currentIndex + 1;
    const averageWatchTime = itemsPlayed > 0 ? state.totalWatchTime / itemsPlayed : 0;
    const errorRate = sessionDuration > 0 ? (state.errorCount / sessionDuration) * 3600 : 0; // errors per hour

    setAnalytics({
      sessionDuration,
      itemsPlayed,
      totalWatchTime: state.totalWatchTime,
      averageWatchTime,
      errorRate,
      bufferingTime: analytics.bufferingTime + (state.status === 'buffering' ? 1 : 0),
      lastActivity: state.lastUpdate
    });
  }, [state]);

  return analytics;
}

// Hook for player persistence across page reloads
export function usePlayerPersistence(
  state: PlayerState,
  actions: ReturnType<typeof usePlayerState>['actions']
) {
  // Save state before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current state
      const manager = new PlayerStateManager(state);
      manager.saveToStorage('playerState_backup');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  // Restore state on mount
  useEffect(() => {
    const restoreState = () => {
      try {
        const backup = localStorage.getItem('playerState_backup');
        if (backup) {
          const savedState = JSON.parse(backup);
          
          // Restore playlist if available
          if (savedState.playlistId && savedState.totalItems > 0) {
            actions.loadPlaylist(savedState.playlistId, savedState.totalItems);
            
            // Restore position if was playing recently (within 5 minutes)
            const timeSinceUpdate = Date.now() - savedState.lastUpdate;
            if (timeSinceUpdate < 5 * 60 * 1000) {
              actions.seekToIndex(savedState.currentIndex);
              actions.seek(savedState.currentTime);
              
              if (savedState.isPlaying) {
                actions.play();
              }
            }
          }
          
          // Clean up backup
          localStorage.removeItem('playerState_backup');
        }
      } catch (error) {
        console.warn('Failed to restore player state:', error);
      }
    };

    restoreState();
  }, [actions]);
}