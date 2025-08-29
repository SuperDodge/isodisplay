'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Playlist, PlaylistItem } from '@/types/playlist';

interface PlaylistPreviewProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaylistPreview({
  playlist,
  isOpen,
  onClose,
}: PlaylistPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Calculate item start times and total duration
  const calculateTimeline = useCallback(() => {
    const timeline: { item: PlaylistItem; startTime: number; endTime: number }[] = [];
    let currentTime = 0;

    playlist.items.forEach((item, index) => {
      const startTime = currentTime;
      const endTime = startTime + item.duration;
      
      timeline.push({
        item,
        startTime,
        endTime,
      });

      // Add transition duration to next item (except for last item)
      if (index < playlist.items.length - 1) {
        currentTime = endTime + item.transitionDuration;
      } else {
        currentTime = endTime;
      }
    });

    return timeline;
  }, [playlist.items]);

  const timeline = calculateTimeline();
  const totalDuration = timeline[timeline.length - 1]?.endTime || 0;

  // Get current item based on playback time
  const getCurrentItemIndex = useCallback((time: number) => {
    for (let i = 0; i < timeline.length; i++) {
      if (time >= timeline[i].startTime && time < timeline[i].endTime) {
        return i;
      }
    }
    return timeline.length - 1;
  }, [timeline]);

  // Animation loop for playback
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp - pausedTimeRef.current;
    }

    const elapsed = (timestamp - startTimeRef.current) / 1000; // Convert to seconds
    
    if (elapsed >= totalDuration) {
      // Playlist finished
      setIsPlaying(false);
      setCurrentTime(totalDuration);
      setCurrentItemIndex(timeline.length - 1);
      return;
    }

    setCurrentTime(elapsed);
    setCurrentItemIndex(getCurrentItemIndex(elapsed));
    
    animationRef.current = requestAnimationFrame(animate);
  }, [totalDuration, timeline.length, getCurrentItemIndex]);

  // Play/Pause control
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      pausedTimeRef.current = currentTime * 1000;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      // Play
      setIsPlaying(true);
      startTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, currentTime, animate]);

  // Skip to next/previous item
  const skipToItem = useCallback((index: number) => {
    if (index < 0 || index >= timeline.length) return;
    
    const newTime = timeline[index].startTime;
    setCurrentTime(newTime);
    setCurrentItemIndex(index);
    pausedTimeRef.current = newTime * 1000;
    
    if (isPlaying) {
      startTimeRef.current = 0;
    }
  }, [timeline, isPlaying]);

  // Seek to specific time
  const seekToTime = useCallback((time: number) => {
    setCurrentTime(time);
    setCurrentItemIndex(getCurrentItemIndex(time));
    pausedTimeRef.current = time * 1000;
    
    if (isPlaying) {
      startTimeRef.current = 0;
    }
  }, [getCurrentItemIndex, isPlaying]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Reset when playlist changes
  useEffect(() => {
    setCurrentTime(0);
    setCurrentItemIndex(0);
    setIsPlaying(false);
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
  }, [playlist]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const currentItem = timeline[currentItemIndex]?.item;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Playlist Preview: {playlist.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Display */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {currentItem && (
              <div className="absolute inset-0 flex items-center justify-center">
                {currentItem.thumbnail ? (
                  <img
                    src={currentItem.thumbnail}
                    alt={currentItem.title}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-white/30 text-center">
                    <div className="text-4xl mb-2">{currentItemIndex + 1}</div>
                    <div className="text-xl">{currentItem.title}</div>
                    <div className="text-sm mt-2">{currentItem.contentType}</div>
                  </div>
                )}
              </div>
            )}

            {/* Transition Overlay */}
            {currentItem && currentTime >= (timeline[currentItemIndex].endTime - currentItem.transitionDuration) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-4">
                <div className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                  Transition: {currentItem.transition}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <Slider
                value={[currentTime]}
                max={totalDuration}
                step={0.1}
                onValueChange={([value]) => seekToTime(value)}
                className="w-full"
              />
              
              {/* Timeline Segments */}
              <div className="absolute inset-0 pointer-events-none">
                {timeline.map((segment, index) => {
                  const left = (segment.startTime / totalDuration) * 100;
                  const width = ((segment.endTime - segment.startTime) / totalDuration) * 100;
                  
                  return (
                    <div
                      key={index}
                      className={`absolute top-0 h-full border-l border-white/20 ${
                        index === currentItemIndex ? 'bg-brand-orange-500/20' : ''
                      }`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Item Thumbnails */}
            <div className="flex gap-1 overflow-x-auto py-2">
              {timeline.map((segment, index) => (
                <button
                  key={index}
                  onClick={() => skipToItem(index)}
                  className={`flex-shrink-0 w-20 h-12 rounded overflow-hidden border-2 transition ${
                    index === currentItemIndex
                      ? 'border-brand-orange-500'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  style={{
                    width: `${Math.max(80, (segment.item.duration / totalDuration) * 800)}px`,
                  }}
                >
                  {segment.item.thumbnail ? (
                    <img
                      src={segment.item.thumbnail}
                      alt={segment.item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/50 text-xs">
                      {index + 1}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => skipToItem(currentItemIndex - 1)}
              disabled={currentItemIndex === 0}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              onClick={togglePlayback}
              size="lg"
              className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white w-20"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>

            <Button
              onClick={() => skipToItem(currentItemIndex + 1)}
              disabled={currentItemIndex >= timeline.length - 1}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Current Item Info */}
          {currentItem && (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">
                    {currentItemIndex + 1}. {currentItem.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-white/70 mt-1">
                    <span>Type: {currentItem.contentType}</span>
                    <span>Duration: {currentItem.duration}s</span>
                    <span>Transition: {currentItem.transition}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatTime(timeline[currentItemIndex].endTime - currentTime)} remaining
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PlaylistPreview;