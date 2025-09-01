'use client';

import { useState, useEffect, useRef } from 'react';
import { PlaylistItem } from '@/types/playlist';
import { FallbackContent } from '../FallbackContent';

interface ImageRendererProps {
  item: PlaylistItem;
  onError?: (error: Error) => void;
}

export function ImageRenderer({ item, onError }: ImageRendererProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const maxRetries = 3;
  const retryDelay = 2000;

  useEffect(() => {
    loadImage();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [item]);

  const loadImage = () => {
    setLoading(true);
    setError(null);

    console.log('ImageRenderer - Loading image for item:', {
      title: item.title,
      contentType: item.contentType,
      hasContent: !!item.content,
      fileUrl: item.content?.fileUrl,
      thumbnail: item.thumbnail
    });

    // Use the fileUrl from the content object if available
    if (item.content?.fileUrl) {
      console.log('Using content fileUrl:', item.content.fileUrl);
      setImageUrl(item.content.fileUrl);
    } else if (item.thumbnail) {
      // Fallback to thumbnail
      console.log('Using thumbnail:', item.thumbnail);
      setImageUrl(item.thumbnail);
    } else {
      // Fallback to placeholder
      const placeholderUrl = `/api/placeholder/1920/1080?text=${encodeURIComponent(item.title)}`;
      console.log('Using placeholder:', placeholderUrl);
      setImageUrl(placeholderUrl);
      
      if (onError) {
        onError(new Error('No image URL available'));
      }
    }
  };

  const handleLoad = () => {
    console.log('Image loaded successfully:', imageUrl);
    setLoading(false);
    setError(null);
    setRetryCount(0);
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image load error:', event.currentTarget.src);
    console.error('Image error event:', event);
    setLoading(false);
    
    const errorMsg = `Failed to load image: ${imageUrl}`;
    setError(errorMsg);

    // Auto-retry if within retry limit
    if (retryCount < maxRetries) {
      scheduleRetry();
    } else {
      if (onError) {
        onError(new Error(errorMsg));
      }
    }
  };

  const scheduleRetry = () => {
    setIsRetrying(true);
    
    retryTimeoutRef.current = setTimeout(() => {
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
      loadImage();
    }, retryDelay);
  };

  const handleManualRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setRetryCount(0);
    setIsRetrying(false);
    loadImage();
  };

  // Use backgroundColor from content or item, fallback to black
  const backgroundColor = item.content?.backgroundColor || item.backgroundColor || item.cropSettings?.backgroundColor || '#000000';
  
  // Get image size from metadata (default 100%)
  const imageSize = item.content?.metadata?.imageSize || 100;
  
  // Calculate the actual dimensions for proper scaling
  const scalingStyle = imageSize === 100 ? {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const
  } : {
    width: 'auto',
    height: 'auto',
    maxWidth: `${imageSize}%`,
    maxHeight: `${imageSize}%`,
    objectFit: 'contain' as const
  };

  // Show fallback content for persistent errors
  if (error && retryCount >= maxRetries && !loading) {
    return (
      <FallbackContent
        type="loading-error"
        message={`Unable to display image: ${item.title}`}
        onRetry={handleManualRetry}
        showRetryButton={true}
      />
    );
  }

  console.log('ImageRenderer render state:', {
    loading,
    error,
    imageUrl,
    retryCount,
    isRetrying,
    backgroundColor,
    imageSize,
    scalingStyle,
    contentMetadata: item.content?.metadata,
    contentBgColor: item.content?.backgroundColor,
    fullItem: item
  });

  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor }}
    >
      {loading && (
        <div className="text-center">
          <div className="text-white text-2xl mb-4">
            {isRetrying ? `Retrying... (${retryCount}/${maxRetries})` : 'Loading Image...'}
          </div>
          <div className="text-gray-400 text-lg">{item.title}</div>
          {isRetrying && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          )}
        </div>
      )}
      
      {error && retryCount < maxRetries && (
        <div className="text-center">
          <div className="text-yellow-500 text-2xl mb-2">Loading Error</div>
          <div className="text-white text-lg mb-4">{item.title}</div>
          <div className="text-gray-400">
            {isRetrying ? `Retrying in ${Math.ceil(retryDelay / 1000)} seconds... (${retryCount}/${maxRetries})` : 'Preparing to retry...'}
          </div>
        </div>
      )}
      
      {!error && imageUrl && (
        <img
          src={imageUrl}
          alt={item.title}
          onLoad={handleLoad}
          onError={handleImageError}
          style={{ 
            display: loading ? 'none' : 'block',
            ...scalingStyle
          }}
        />
      )}
    </div>
  );
}

export default ImageRenderer;