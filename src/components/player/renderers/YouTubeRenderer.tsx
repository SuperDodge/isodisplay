'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PlaylistItem } from '@/types/playlist';

interface YouTubeRendererProps {
  item: PlaylistItem;
  onEnded?: () => void;
}

export function YouTubeRenderer({ item, onEnded }: YouTubeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVertical, setIsVertical] = useState(false);

  useEffect(() => {
    // Extract video ID from metadata or URL
    const videoId =
      item.content?.metadata?.videoId || extractVideoIdFromUrl(item.content?.fileUrl || '');

    if (!videoId) {
      setError('No YouTube video ID found');
      return;
    }

    // Load YouTube IFrame API if not already loaded
    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Wait for API to load
      window.onYouTubeIframeAPIReady = () => {
        createPlayer(videoId);
      };
    } else {
      // API already loaded, create player after a brief delay to ensure container is ready
      setTimeout(() => createPlayer(videoId), 100);
    }

    return () => {
      // Cleanup player
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {
          console.error('Error destroying YouTube player:', e);
        }
      }
    };
  }, [item]);

  const createPlayer = (videoId: string) => {
    if (!containerRef.current) {
      console.log('YouTube container not ready');
      return;
    }

    // Don't create if player already exists
    if (playerRef.current) {
      console.log('YouTube player already exists');
      return;
    }

    console.log('Creating YouTube player for video:', videoId);

    // Get duration - 0 means play full video
    const duration = item.duration || 0;
    const playFullVideo = duration === 0 || !duration;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0, // Hide controls for display mode
        modestbranding: 1,
        rel: 0, // Don't show related videos
        showinfo: 0,
        iv_load_policy: 3, // Hide annotations
        fs: 0, // Hide fullscreen button
        disablekb: 1, // Disable keyboard controls
        loop: 0,
        mute: 1, // Must be muted for autoplay to work in modern browsers
        playsinline: 1, // Play inline on mobile devices
      },
      events: {
        onReady: (event: any) => {
          setIsReady(true);

          // Check if it's a vertical video (Shorts)
          // YouTube Shorts are typically 9:16 aspect ratio
          const player = event.target;
          const videoData = player.getVideoData();
          
          // Check video title or URL for "Shorts" indicator
          const videoUrl = player.getVideoUrl();
          const videoTitle = videoData.title || '';
          const isShort = videoUrl.includes('/shorts/') || videoTitle.includes('#shorts') || videoTitle.includes('#short');
          
          // Also check duration - Shorts are typically under 60 seconds
          const videoDuration = player.getDuration();
          const isShortDuration = videoDuration > 0 && videoDuration <= 60;
          
          // Detect vertical video/Shorts
          setTimeout(() => {
            try {
              // YouTube Shorts can be detected by URL pattern or duration
              const isVert = isShort || isShortDuration;
              console.log('YouTube video check - URL:', videoUrl, 'Duration:', videoDuration, 'Is Short:', isShort, 'Is vertical:', isVert);
              setIsVertical(isVert);
            } catch (e) {
              console.log('Error in vertical detection:', e);
            }
          }, 500);

          // Ensure video plays (fallback for autoplay issues)
          event.target.playVideo();

          // Additional fallback: check if playing after a short delay
          setTimeout(() => {
            if (
              playerRef.current &&
              playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING
            ) {
              console.log('YouTube video not playing, attempting to start again...');
              playerRef.current.playVideo();
            }
          }, 500);

          // If we have a specific duration, set a timer
          if (!playFullVideo && duration > 0) {
            setTimeout(() => {
              if (playerRef.current) {
                playerRef.current.stopVideo();
                onEnded?.();
              }
            }, duration * 1000);
          }
        },
        onStateChange: (event: any) => {
          // Video ended naturally
          if (event.data === window.YT.PlayerState.ENDED) {
            onEnded?.();
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
          setError(`YouTube player error: ${event.data}`);
          // Still call onEnded to move to next item
          setTimeout(() => onEnded?.(), 3000);
        },
      },
    });
  };

  const extractVideoIdFromUrl = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([^&\n?#]+)$/, // Just the ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="text-red-500 mb-2">Error loading YouTube video</div>
          <div className="text-sm text-white/70">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Main video container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      />
      
      {/* Loading overlay */}
      {!isReady && <div className="absolute inset-0 bg-black z-20" />}
    </div>
  );
}

// Add TypeScript declaration for YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
