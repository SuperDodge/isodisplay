// Player state management for display controllers
// Handles playback state, playlist management, and remote control

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'stopped';
export type RepeatMode = 'none' | 'all' | 'single';
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface PlayerState {
  // Playback state
  status: PlayerStatus;
  currentIndex: number;
  currentItemId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0-100
  speed: PlaybackSpeed;
  
  // Timing
  currentTime: number; // seconds
  duration: number; // seconds
  remainingTime: number; // seconds
  progress: number; // 0-100 percentage
  
  // Playlist state
  playlistId: string | null;
  totalItems: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  
  // Control state
  fullscreen: boolean;
  remoteControlEnabled: boolean;
  keyboardControlEnabled: boolean;
  autoplay: boolean;
  
  // Error state
  lastError: string | null;
  errorCount: number;
  
  // Performance state
  bufferedTime: number;
  loadingProgress: number; // 0-100 for current item loading
  preloadedItems: string[]; // item IDs that are preloaded
  
  // Metadata
  lastUpdate: number; // timestamp
  sessionStartTime: number; // timestamp
  totalWatchTime: number; // seconds
}

export type PlayerAction = 
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SEEK'; payload: { time: number } }
  | { type: 'SEEK_TO_INDEX'; payload: { index: number } }
  | { type: 'SET_VOLUME'; payload: { volume: number } }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_SPEED'; payload: { speed: PlaybackSpeed } }
  | { type: 'SET_REPEAT_MODE'; payload: { mode: RepeatMode } }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'LOAD_PLAYLIST'; payload: { playlistId: string; totalItems: number } }
  | { type: 'UPDATE_PROGRESS'; payload: { currentTime: number; duration: number } }
  | { type: 'SET_STATUS'; payload: { status: PlayerStatus } }
  | { type: 'SET_CURRENT_ITEM'; payload: { index: number; itemId: string } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING_PROGRESS'; payload: { progress: number } }
  | { type: 'ADD_PRELOADED'; payload: { itemId: string } }
  | { type: 'REMOVE_PRELOADED'; payload: { itemId: string } }
  | { type: 'SET_BUFFERED_TIME'; payload: { time: number } }
  | { type: 'ENABLE_REMOTE_CONTROL'; payload: { enabled: boolean } }
  | { type: 'ENABLE_KEYBOARD_CONTROL'; payload: { enabled: boolean } }
  | { type: 'SET_AUTOPLAY'; payload: { enabled: boolean } }
  | { type: 'RESET_STATE' };

export const initialPlayerState: PlayerState = {
  status: 'idle',
  currentIndex: 0,
  currentItemId: null,
  isPlaying: false,
  isMuted: false,
  volume: 100,
  speed: 1,
  currentTime: 0,
  duration: 0,
  remainingTime: 0,
  progress: 0,
  playlistId: null,
  totalItems: 0,
  repeatMode: 'all',
  shuffle: false,
  fullscreen: false,
  remoteControlEnabled: true,
  keyboardControlEnabled: true,
  autoplay: true,
  lastError: null,
  errorCount: 0,
  bufferedTime: 0,
  loadingProgress: 0,
  preloadedItems: [],
  lastUpdate: Date.now(),
  sessionStartTime: Date.now(),
  totalWatchTime: 0
};

export function playerStateReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const now = Date.now();
  const baseUpdate = {
    ...state,
    lastUpdate: now
  };

  switch (action.type) {
    case 'PLAY':
      return {
        ...baseUpdate,
        isPlaying: true,
        status: state.status === 'error' ? 'loading' : (state.status === 'idle' ? 'loading' : 'playing'),
        lastError: null
      };

    case 'PAUSE':
      return {
        ...baseUpdate,
        isPlaying: false,
        status: state.status === 'playing' ? 'paused' : state.status
      };

    case 'STOP':
      return {
        ...baseUpdate,
        isPlaying: false,
        status: 'stopped',
        currentTime: 0,
        progress: 0,
        remainingTime: state.duration
      };

    case 'NEXT':
      const nextIndex = state.shuffle 
        ? Math.floor(Math.random() * state.totalItems)
        : (state.currentIndex + 1) % state.totalItems;
      
      return {
        ...baseUpdate,
        currentIndex: nextIndex,
        currentItemId: null, // Will be set when item loads
        status: 'loading',
        currentTime: 0,
        progress: 0,
        loadingProgress: 0
      };

    case 'PREVIOUS':
      const prevIndex = state.shuffle 
        ? Math.floor(Math.random() * state.totalItems)
        : state.currentIndex === 0 ? state.totalItems - 1 : state.currentIndex - 1;
      
      return {
        ...baseUpdate,
        currentIndex: prevIndex,
        currentItemId: null,
        status: 'loading',
        currentTime: 0,
        progress: 0,
        loadingProgress: 0
      };

    case 'SEEK':
      const seekTime = Math.max(0, Math.min(action.payload.time, state.duration));
      return {
        ...baseUpdate,
        currentTime: seekTime,
        progress: state.duration > 0 ? (seekTime / state.duration) * 100 : 0,
        remainingTime: state.duration - seekTime
      };

    case 'SEEK_TO_INDEX':
      if (action.payload.index >= 0 && action.payload.index < state.totalItems) {
        return {
          ...baseUpdate,
          currentIndex: action.payload.index,
          currentItemId: null,
          status: 'loading',
          currentTime: 0,
          progress: 0,
          loadingProgress: 0
        };
      }
      return baseUpdate;

    case 'SET_VOLUME':
      const volume = Math.max(0, Math.min(100, action.payload.volume));
      return {
        ...baseUpdate,
        volume,
        isMuted: volume === 0 ? true : state.isMuted
      };

    case 'TOGGLE_MUTE':
      return {
        ...baseUpdate,
        isMuted: !state.isMuted
      };

    case 'SET_SPEED':
      return {
        ...baseUpdate,
        speed: action.payload.speed
      };

    case 'SET_REPEAT_MODE':
      return {
        ...baseUpdate,
        repeatMode: action.payload.mode
      };

    case 'TOGGLE_SHUFFLE':
      return {
        ...baseUpdate,
        shuffle: !state.shuffle
      };

    case 'TOGGLE_FULLSCREEN':
      return {
        ...baseUpdate,
        fullscreen: !state.fullscreen
      };

    case 'LOAD_PLAYLIST':
      return {
        ...baseUpdate,
        playlistId: action.payload.playlistId,
        totalItems: action.payload.totalItems,
        currentIndex: 0,
        currentItemId: null,
        status: action.payload.totalItems > 0 ? 'loading' : 'idle',
        currentTime: 0,
        duration: 0,
        progress: 0,
        lastError: null,
        errorCount: 0,
        preloadedItems: [],
        sessionStartTime: now
      };

    case 'UPDATE_PROGRESS':
      const { currentTime, duration } = action.payload;
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
      const remainingTime = duration - currentTime;
      
      // Update total watch time if playing
      const watchTimeDelta = state.isPlaying ? (now - state.lastUpdate) / 1000 : 0;
      
      return {
        ...baseUpdate,
        currentTime,
        duration,
        progress,
        remainingTime,
        totalWatchTime: state.totalWatchTime + watchTimeDelta
      };

    case 'SET_STATUS':
      return {
        ...baseUpdate,
        status: action.payload.status,
        lastError: action.payload.status === 'error' ? state.lastError : null
      };

    case 'SET_CURRENT_ITEM':
      return {
        ...baseUpdate,
        currentIndex: action.payload.index,
        currentItemId: action.payload.itemId,
        currentTime: 0,
        progress: 0,
        loadingProgress: 100,
        lastError: null
      };

    case 'SET_ERROR':
      return {
        ...baseUpdate,
        status: 'error',
        lastError: action.payload.error,
        errorCount: state.errorCount + 1,
        isPlaying: false
      };

    case 'CLEAR_ERROR':
      return {
        ...baseUpdate,
        lastError: null,
        status: state.status === 'error' ? 'idle' : state.status
      };

    case 'SET_LOADING_PROGRESS':
      return {
        ...baseUpdate,
        loadingProgress: Math.max(0, Math.min(100, action.payload.progress))
      };

    case 'ADD_PRELOADED':
      if (!state.preloadedItems.includes(action.payload.itemId)) {
        return {
          ...baseUpdate,
          preloadedItems: [...state.preloadedItems, action.payload.itemId]
        };
      }
      return baseUpdate;

    case 'REMOVE_PRELOADED':
      return {
        ...baseUpdate,
        preloadedItems: state.preloadedItems.filter(id => id !== action.payload.itemId)
      };

    case 'SET_BUFFERED_TIME':
      return {
        ...baseUpdate,
        bufferedTime: Math.max(0, action.payload.time)
      };

    case 'ENABLE_REMOTE_CONTROL':
      return {
        ...baseUpdate,
        remoteControlEnabled: action.payload.enabled
      };

    case 'ENABLE_KEYBOARD_CONTROL':
      return {
        ...baseUpdate,
        keyboardControlEnabled: action.payload.enabled
      };

    case 'SET_AUTOPLAY':
      return {
        ...baseUpdate,
        autoplay: action.payload.enabled
      };

    case 'RESET_STATE':
      return {
        ...initialPlayerState,
        sessionStartTime: now,
        lastUpdate: now
      };

    default:
      return baseUpdate;
  }
}

// Helper functions for state management
export class PlayerStateManager {
  private state: PlayerState;
  private listeners: Set<(state: PlayerState) => void> = new Set();
  private dispatch: (action: PlayerAction) => void;

  constructor(initialState: PlayerState = initialPlayerState) {
    this.state = initialState;
    this.dispatch = (action: PlayerAction) => {
      const newState = playerStateReducer(this.state, action);
      if (newState !== this.state) {
        this.state = newState;
        this.notifyListeners();
      }
    };
  }

  // State access
  getState(): PlayerState {
    return this.state;
  }

  // Action dispatchers
  play() { this.dispatch({ type: 'PLAY' }); }
  pause() { this.dispatch({ type: 'PAUSE' }); }
  stop() { this.dispatch({ type: 'STOP' }); }
  next() { this.dispatch({ type: 'NEXT' }); }
  previous() { this.dispatch({ type: 'PREVIOUS' }); }
  seek(time: number) { this.dispatch({ type: 'SEEK', payload: { time } }); }
  seekToIndex(index: number) { this.dispatch({ type: 'SEEK_TO_INDEX', payload: { index } }); }
  setVolume(volume: number) { this.dispatch({ type: 'SET_VOLUME', payload: { volume } }); }
  toggleMute() { this.dispatch({ type: 'TOGGLE_MUTE' }); }
  setSpeed(speed: PlaybackSpeed) { this.dispatch({ type: 'SET_SPEED', payload: { speed } }); }
  setRepeatMode(mode: RepeatMode) { this.dispatch({ type: 'SET_REPEAT_MODE', payload: { mode } }); }
  toggleShuffle() { this.dispatch({ type: 'TOGGLE_SHUFFLE' }); }
  toggleFullscreen() { this.dispatch({ type: 'TOGGLE_FULLSCREEN' }); }
  
  loadPlaylist(playlistId: string, totalItems: number) {
    this.dispatch({ type: 'LOAD_PLAYLIST', payload: { playlistId, totalItems } });
  }
  
  updateProgress(currentTime: number, duration: number) {
    this.dispatch({ type: 'UPDATE_PROGRESS', payload: { currentTime, duration } });
  }
  
  setStatus(status: PlayerStatus) {
    this.dispatch({ type: 'SET_STATUS', payload: { status } });
  }
  
  setCurrentItem(index: number, itemId: string) {
    this.dispatch({ type: 'SET_CURRENT_ITEM', payload: { index, itemId } });
  }
  
  setError(error: string) {
    this.dispatch({ type: 'SET_ERROR', payload: { error } });
  }
  
  clearError() {
    this.dispatch({ type: 'CLEAR_ERROR' });
  }
  
  setLoadingProgress(progress: number) {
    this.dispatch({ type: 'SET_LOADING_PROGRESS', payload: { progress } });
  }
  
  addPreloaded(itemId: string) {
    this.dispatch({ type: 'ADD_PRELOADED', payload: { itemId } });
  }
  
  removePreloaded(itemId: string) {
    this.dispatch({ type: 'REMOVE_PRELOADED', payload: { itemId } });
  }
  
  setBufferedTime(time: number) {
    this.dispatch({ type: 'SET_BUFFERED_TIME', payload: { time } });
  }
  
  enableRemoteControl(enabled: boolean) {
    this.dispatch({ type: 'ENABLE_REMOTE_CONTROL', payload: { enabled } });
  }
  
  enableKeyboardControl(enabled: boolean) {
    this.dispatch({ type: 'ENABLE_KEYBOARD_CONTROL', payload: { enabled } });
  }
  
  setAutoplay(enabled: boolean) {
    this.dispatch({ type: 'SET_AUTOPLAY', payload: { enabled } });
  }
  
  reset() {
    this.dispatch({ type: 'RESET_STATE' });
  }

  // Computed properties
  get canPlay(): boolean {
    return this.state.totalItems > 0 && !['error', 'loading'].includes(this.state.status);
  }
  
  get canGoNext(): boolean {
    return this.state.totalItems > 1 || this.state.repeatMode !== 'none';
  }
  
  get canGoPrevious(): boolean {
    return this.state.totalItems > 1 || this.state.repeatMode !== 'none';
  }
  
  get hasPlaylist(): boolean {
    return this.state.playlistId !== null && this.state.totalItems > 0;
  }
  
  get isBuffering(): boolean {
    return this.state.status === 'buffering' || (this.state.status === 'loading' && this.state.loadingProgress < 100);
  }
  
  get playbackInfo(): string {
    const { currentIndex, totalItems, currentTime, duration } = this.state;
    const timeStr = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;
    const itemStr = `${currentIndex + 1} / ${totalItems}`;
    return `${itemStr} • ${timeStr}`;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Event listeners
  subscribe(listener: (state: PlayerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Persistence
  saveToStorage(key: string = 'playerState'): void {
    try {
      localStorage.setItem(key, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save player state:', error);
    }
  }

  loadFromStorage(key: string = 'playerState'): boolean {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const state = JSON.parse(saved);
        this.state = { ...this.state, ...state, lastUpdate: Date.now() };
        this.notifyListeners();
        return true;
      }
    } catch (error) {
      console.warn('Failed to load player state:', error);
    }
    return false;
  }
}