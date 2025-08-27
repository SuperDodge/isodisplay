'use client';

import { useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Shuffle,
  Repeat,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { cn } from '@/lib/utils';

interface PlayerControlsProps {
  className?: string;
  alwaysShow?: boolean;
  minimal?: boolean;
}

export function PlayerControls({ 
  className, 
  alwaysShow = false,
  minimal = false 
}: PlayerControlsProps) {
  const { 
    state, 
    play, 
    pause, 
    togglePlay,
    next, 
    previous, 
    setVolume, 
    toggleMute,
    toggleFullscreen,
    showControlsTemporarily,
    dispatch
  } = usePlayer();
  
  const controlsRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Show controls on mouse move
  useEffect(() => {
    if (alwaysShow) return;
    
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      showControlsTemporarily(5000);
    };
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show controls when any control key is pressed
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'F11', 'm'].includes(e.key)) {
        showControlsTemporarily(5000);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyPress);
      if (timeout) clearTimeout(timeout);
    };
  }, [alwaysShow, showControlsTemporarily]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previous();
          break;
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'l':
          e.preventDefault();
          dispatch({ type: 'TOGGLE_LOOP' });
          break;
        case 's':
          e.preventDefault();
          dispatch({ type: 'TOGGLE_SHUFFLE' });
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percentage = parseInt(e.key) * 10;
          const newIndex = Math.floor((state.playlist?.items.length || 0) * percentage / 100);
          dispatch({ type: 'SEEK', payload: newIndex });
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state, togglePlay, next, previous, setVolume, toggleMute, toggleFullscreen, dispatch]);
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !state.playlist) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newIndex = Math.floor(state.playlist.items.length * percentage);
    
    dispatch({ type: 'SEEK', payload: newIndex });
  };
  
  const shouldShow = alwaysShow || state.showControls;
  
  if (minimal) {
    return (
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          shouldShow ? "opacity-100" : "opacity-0 pointer-events-none",
          className
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={previous}
            className="text-white hover:text-orange-500 transition-colors"
            aria-label="Previous"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button
            onClick={togglePlay}
            className="text-white hover:text-orange-500 transition-colors p-2 bg-white/10 rounded-full"
            aria-label={state.isPlaying ? "Pause" : "Play"}
          >
            {state.isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>
          
          <button
            onClick={next}
            className="text-white hover:text-orange-500 transition-colors"
            aria-label="Next"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={controlsRef}
      className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 transition-opacity duration-300",
        shouldShow ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-xl font-bold">{state.display?.name}</h2>
          {state.currentItem && (
            <p className="text-sm text-gray-300">
              {state.currentIndex + 1} / {state.playlist?.items.length || 0} - {state.currentItem.content.title}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={cn(
            "w-2 h-2 rounded-full",
            state.isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          
          {/* Settings */}
          <button className="text-white hover:text-orange-500 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-orange-500 transition-colors"
            aria-label={state.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {state.isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="relative h-1 bg-white/20 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
        >
          <div 
            className="absolute left-0 top-0 h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-300"
            style={{ left: `${state.progress}%` }}
          />
        </div>
        
        {/* Time Display */}
        <div className="flex items-center justify-between text-white text-sm">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Shuffle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SHUFFLE' })}
              className={cn(
                "transition-colors",
                state.shuffle ? "text-orange-500" : "text-white hover:text-orange-500"
              )}
              aria-label="Toggle shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            
            {/* Previous */}
            <button
              onClick={previous}
              className="text-white hover:text-orange-500 transition-colors"
              aria-label="Previous"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-orange-500 transition-colors p-3 bg-white/10 rounded-full"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>
            
            {/* Next */}
            <button
              onClick={next}
              className="text-white hover:text-orange-500 transition-colors"
              aria-label="Next"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            
            {/* Loop */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_LOOP' })}
              className={cn(
                "transition-colors",
                state.loop ? "text-orange-500" : "text-white hover:text-orange-500"
              )}
              aria-label="Toggle loop"
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>
          
          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="text-white hover:text-orange-500 transition-colors"
              aria-label={state.isMuted ? "Unmute" : "Mute"}
            >
              {state.isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            <input
              ref={volumeRef}
              type="range"
              min="0"
              max="100"
              value={state.isMuted ? 0 : state.volume * 100}
              onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
              className="w-24 accent-orange-500"
              aria-label="Volume"
            />
            
            <span className="text-white text-sm w-10">
              {Math.round(state.isMuted ? 0 : state.volume * 100)}%
            </span>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        {state.showControls && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 rounded-lg p-3 text-white text-xs space-y-1">
            <div>Space/K: Play/Pause • ←/→: Previous/Next • ↑/↓: Volume</div>
            <div>M: Mute • F/F11: Fullscreen • L: Loop • S: Shuffle</div>
            <div>0-9: Jump to position</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerControls;