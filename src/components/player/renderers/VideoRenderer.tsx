'use client';

import { useRef, useEffect } from 'react';
import { PlaylistItem } from '@/types/playlist';

interface VideoRendererProps {
  item: PlaylistItem;
  onEnded: () => void;
}

export function VideoRenderer({ item, onEnded }: VideoRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Video autoplay failed:', error);
      });
    }
  }, [item]);

  // In production, get the actual video URL from content service
  const videoUrl = item.thumbnail || `/api/video/${item.contentId}`;

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
        controls={false}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoRenderer;