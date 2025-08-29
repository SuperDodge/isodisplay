import React, { useRef, useEffect, useState } from 'react';
import { PlaylistItem } from '@/types/playlist';

interface VerticalVideoRendererProps {
  item: PlaylistItem;
  isPlaying: boolean;
  onEnded: () => void;
  lowMemoryMode?: boolean;
}

export default function VerticalVideoRenderer({
  item,
  isPlaying,
  onEnded,
  lowMemoryMode = false
}: VerticalVideoRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  // Determine if video is vertical based on metadata or after load
  useEffect(() => {
    const checkAspectRatio = () => {
      if (videoRef.current) {
        const { videoWidth, videoHeight } = videoRef.current;
        console.log('Video dimensions:', videoWidth, 'x', videoHeight);
        if (videoWidth && videoHeight) {
          const ratio = videoWidth / videoHeight;
          setAspectRatio(ratio);
          // Consider video vertical if aspect ratio is less than 1 (taller than wide)
          // Or specifically 9:16 (0.5625) for typical vertical videos
          const isVert = ratio < 0.8;
          console.log('Aspect ratio:', ratio, 'Is vertical:', isVert);
          setIsVertical(isVert);
        }
      }
    };

    // Wait for video element to be ready and check
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.addEventListener('loadedmetadata', checkAspectRatio);
        // Also check immediately in case metadata is already loaded
        checkAspectRatio();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', checkAspectRatio);
      }
    };
  }, [item]);

  // Sync playback between main and background videos
  useEffect(() => {
    if (isVertical && videoRef.current && backgroundVideoRef.current) {
      const syncVideos = () => {
        if (backgroundVideoRef.current && videoRef.current) {
          backgroundVideoRef.current.currentTime = videoRef.current.currentTime;
        }
      };

      videoRef.current.addEventListener('timeupdate', syncVideos);
      
      // Play/pause background video when main video plays/pauses
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
        backgroundVideoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
        backgroundVideoRef.current.pause();
      }

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('timeupdate', syncVideos);
        }
      };
    } else if (videoRef.current) {
      // Regular playback for non-vertical videos
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isVertical]);

  // Handle video source
  const videoSrc = item.content?.fileUrl;

  if (!videoSrc) {
    return null; // This renderer only handles direct video files
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background layer for vertical videos */}
      {isVertical && !lowMemoryMode && (
        <div className="absolute inset-0">
          {/* Blurred background video */}
          <video
            ref={backgroundVideoRef}
            className="absolute inset-0 w-full h-full object-cover scale-150"
            style={{
              filter: 'blur(40px) brightness(0.4)',
              transform: 'scale(1.5)',
            }}
            src={videoSrc}
            loop={false}
            muted
            playsInline
          />
          {/* Gradient overlay for better contrast */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)'
            }}
          />
        </div>
      )}

      {/* Main video */}
      <video
        ref={videoRef}
        className={`relative z-10 w-full h-full ${
          isVertical ? 'object-contain' : 'object-contain'
        }`}
        src={videoSrc}
        autoPlay={isPlaying}
        loop={false}
        muted
        playsInline
        onEnded={onEnded}
        preload={lowMemoryMode ? "none" : "auto"}
      />

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 text-white text-xs bg-black/50 px-2 py-1 rounded z-20">
          {isVertical ? `Vertical Video (${aspectRatio.toFixed(2)}:1)` : `Regular Video (${aspectRatio.toFixed(2)}:1)`}
        </div>
      )}
    </div>
  );
}