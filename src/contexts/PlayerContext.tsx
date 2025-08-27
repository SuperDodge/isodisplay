'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Display } from '@/types/display';
import { Playlist, PlaylistItem } from '@/types/playlist';

// Player State Types
export interface PlayerState {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  
  // Content state
  currentIndex: number;
  currentItem: PlaylistItem | null;
  nextItem: PlaylistItem | null;
  playlist: Playlist | null;
  display: Display | null;
  
  // Control state
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  isFullscreen: boolean;
  showControls: boolean;
  controlsTimeout: number;
  
  // Progress state
  currentTime: number;
  duration: number;
  progress: number;
  
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastSyncTime: Date | null;
  
  // Settings
  autoPlay: boolean;
  loop: boolean;
  shuffle: boolean;
  transitionDuration: number;
  
  // Error state
  error: string | null;
  errorCount: number;
}

// Action Types
export type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SEEK'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SHOW_CONTROLS'; payload?: number }
  | { type: 'HIDE_CONTROLS' }
  | { type: 'SET_PLAYLIST'; payload: Playlist }
  | { type: 'SET_DISPLAY'; payload: Display }
  | { type: 'SET_CURRENT_ITEM'; payload: PlaylistItem | null }
  | { type: 'SET_NEXT_ITEM'; payload: PlaylistItem | null }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'UPDATE_PROGRESS'; payload: { currentTime: number; duration: number } }
  | { type: 'SET_CONNECTION_STATUS'; payload: PlayerState['connectionStatus'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BUFFERING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_LOOP' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_AUTOPLAY' }
  | { type: 'SYNC_STATE'; payload: Partial<PlayerState> }
  | { type: 'RESET' }
  | { type: 'RECOVER_STATE'; payload: PlayerState };

// Initial State
const initialState: PlayerState = {
  isPlaying: false,
  isPaused: false,
  isStopped: true,
  isLoading: false,
  isBuffering: false,
  currentIndex: 0,
  currentItem: null,
  nextItem: null,
  playlist: null,
  display: null,
  volume: 1.0,
  isMuted: false,
  playbackSpeed: 1.0,
  isFullscreen: false,
  showControls: false,
  controlsTimeout: 3000,
  currentTime: 0,
  duration: 0,
  progress: 0,
  isConnected: false,
  connectionStatus: 'disconnected',
  lastSyncTime: null,
  autoPlay: true,
  loop: true,
  shuffle: false,
  transitionDuration: 1000,
  error: null,
  errorCount: 0,
};

// Reducer
function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        isPlaying: true,
        isPaused: false,
        isStopped: false,
        error: null,
      };
      
    case 'PAUSE':
      return {
        ...state,
        isPlaying: false,
        isPaused: true,
        isStopped: false,
      };
      
    case 'STOP':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        isStopped: true,
        currentTime: 0,
        progress: 0,
      };
      
    case 'TOGGLE_PLAY':
      return {
        ...state,
        isPlaying: !state.isPlaying,
        isPaused: state.isPlaying,
        isStopped: false,
      };
      
    case 'NEXT':
      const nextIndex = state.playlist 
        ? (state.currentIndex + 1) % state.playlist.items.length
        : 0;
      return {
        ...state,
        currentIndex: nextIndex,
        currentTime: 0,
        progress: 0,
      };
      
    case 'PREVIOUS':
      const prevIndex = state.playlist
        ? state.currentIndex === 0 
          ? state.playlist.items.length - 1 
          : state.currentIndex - 1
        : 0;
      return {
        ...state,
        currentIndex: prevIndex,
        currentTime: 0,
        progress: 0,
      };
      
    case 'SEEK':
      return {
        ...state,
        currentIndex: action.payload,
        currentTime: 0,
        progress: 0,
      };
      
    case 'SET_VOLUME':
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload)),
        isMuted: action.payload === 0,
      };
      
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted,
      };
      
    case 'SET_SPEED':
      return {
        ...state,
        playbackSpeed: action.payload,
      };
      
    case 'TOGGLE_FULLSCREEN':
      return {
        ...state,
        isFullscreen: !state.isFullscreen,
      };
      
    case 'SHOW_CONTROLS':
      return {
        ...state,
        showControls: true,
        controlsTimeout: action.payload || state.controlsTimeout,
      };
      
    case 'HIDE_CONTROLS':
      return {
        ...state,
        showControls: false,
      };
      
    case 'SET_PLAYLIST':
      return {
        ...state,
        playlist: action.payload,
        currentIndex: 0,
        currentItem: action.payload.items[0] || null,
        nextItem: action.payload.items[1] || null,
      };
      
    case 'SET_DISPLAY':
      return {
        ...state,
        display: action.payload,
      };
      
    case 'SET_CURRENT_ITEM':
      return {
        ...state,
        currentItem: action.payload,
      };
      
    case 'SET_NEXT_ITEM':
      return {
        ...state,
        nextItem: action.payload,
      };
      
    case 'SET_CURRENT_INDEX':
      return {
        ...state,
        currentIndex: action.payload,
      };
      
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        currentTime: action.payload.currentTime,
        duration: action.payload.duration,
        progress: action.payload.duration > 0 
          ? (action.payload.currentTime / action.payload.duration) * 100 
          : 0,
      };
      
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
        isConnected: action.payload === 'connected',
        lastSyncTime: action.payload === 'connected' ? new Date() : state.lastSyncTime,
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case 'SET_BUFFERING':
      return {
        ...state,
        isBuffering: action.payload,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        errorCount: action.payload ? state.errorCount + 1 : 0,
      };
      
    case 'TOGGLE_LOOP':
      return {
        ...state,
        loop: !state.loop,
      };
      
    case 'TOGGLE_SHUFFLE':
      return {
        ...state,
        shuffle: !state.shuffle,
      };
      
    case 'TOGGLE_AUTOPLAY':
      return {
        ...state,
        autoPlay: !state.autoPlay,
      };
      
    case 'SYNC_STATE':
      return {
        ...state,
        ...action.payload,
        lastSyncTime: new Date(),
      };
      
    case 'RESET':
      return initialState;
      
    case 'RECOVER_STATE':
      return {
        ...action.payload,
        lastSyncTime: new Date(),
      };
      
    default:
      return state;
  }
}

// Context
interface PlayerContextType {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  
  // Helper functions
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (index: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  showControlsTemporarily: (timeout?: number) => void;
  syncWithBackend: () => Promise<void>;
  recoverFromError: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Provider Component
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  
  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('playerState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'RECOVER_STATE', payload: parsed });
      } catch (error) {
        console.error('Failed to recover player state:', error);
      }
    }
  }, []);
  
  // Save state to localStorage
  useEffect(() => {
    const stateToSave = {
      volume: state.volume,
      isMuted: state.isMuted,
      playbackSpeed: state.playbackSpeed,
      autoPlay: state.autoPlay,
      loop: state.loop,
      shuffle: state.shuffle,
    };
    localStorage.setItem('playerState', JSON.stringify(stateToSave));
  }, [state.volume, state.isMuted, state.playbackSpeed, state.autoPlay, state.loop, state.shuffle]);
  
  // Auto-hide controls
  useEffect(() => {
    if (state.showControls && state.controlsTimeout > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_CONTROLS' });
      }, state.controlsTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [state.showControls, state.controlsTimeout]);
  
  // Helper functions
  const play = () => dispatch({ type: 'PLAY' });
  const pause = () => dispatch({ type: 'PAUSE' });
  const stop = () => dispatch({ type: 'STOP' });
  const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });
  const next = () => dispatch({ type: 'NEXT' });
  const previous = () => dispatch({ type: 'PREVIOUS' });
  const seek = (index: number) => dispatch({ type: 'SEEK', payload: index });
  const setVolume = (volume: number) => dispatch({ type: 'SET_VOLUME', payload: volume });
  const toggleMute = () => dispatch({ type: 'TOGGLE_MUTE' });
  const toggleFullscreen = () => dispatch({ type: 'TOGGLE_FULLSCREEN' });
  
  const showControlsTemporarily = (timeout?: number) => {
    dispatch({ type: 'SHOW_CONTROLS', payload: timeout });
  };
  
  const syncWithBackend = async () => {
    if (!state.display) return;
    
    try {
      const response = await fetch(`/api/displays/${state.display.id}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPlaying: state.isPlaying,
          currentIndex: state.currentIndex,
          volume: state.volume,
          isMuted: state.isMuted,
        }),
      });
      
      if (response.ok) {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      }
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
    }
  };
  
  const recoverFromError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
    if (state.errorCount < 3) {
      play();
    } else {
      stop();
    }
  };
  
  const value: PlayerContextType = {
    state,
    dispatch,
    play,
    pause,
    stop,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    showControlsTemporarily,
    syncWithBackend,
    recoverFromError,
  };
  
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

// Hook to use the context
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

export default PlayerContext;