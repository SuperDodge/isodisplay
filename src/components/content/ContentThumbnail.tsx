'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ContentType } from '@/generated/prisma';
import { FileText, Film, Image as ImageIcon, Link, Youtube } from 'lucide-react';

interface ContentThumbnailProps {
  type: ContentType | string;  // Can be enum or string from transformer
  thumbnailUrl?: string;
  name: string;
  backgroundColor?: string;
  imageScale?: 'contain' | 'cover' | 'fill';
  imageSize?: number;
  metadata?: any;
}

export function ContentThumbnail({ type, thumbnailUrl, name, backgroundColor = '#000000', imageScale = 'contain', imageSize = 100, metadata }: ContentThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  const getContentIcon = (type: ContentType | string) => {
    const typeUpper = type?.toString().toUpperCase();
    switch (typeUpper) {
      case 'IMAGE':
      case ContentType.IMAGE:
        return <ImageIcon className="w-8 h-8" />;
      case 'VIDEO':
      case ContentType.VIDEO:
        return <Film className="w-8 h-8" />;
      case 'PDF':
      case ContentType.PDF:
        return <FileText className="w-8 h-8" />;
      case 'URL':
      case ContentType.URL:
        return <Link className="w-8 h-8" />;
      case 'YOUTUBE':
      case ContentType.YOUTUBE:
        return <Youtube className="w-8 h-8" />;
      default:
        return <FileText className="w-8 h-8" />;
    }
  };

  // For images, videos, PDFs, and YouTube content with thumbnails, show the thumbnail
  // The display thumbnail already has the correct 16:9 aspect ratio, background color, and scaling applied
  // Note: type comes as lowercase string from the transformer, ContentType enum values are uppercase
  const typeUpper = type?.toString().toUpperCase();
  if ((typeUpper === 'IMAGE' || typeUpper === 'VIDEO' || typeUpper === 'YOUTUBE' || typeUpper === 'PDF') && thumbnailUrl && !imageError) {
    // If the thumbnail URL contains 'display-thumb', it's a pre-generated display thumbnail
    // that already has the background and scaling baked in
    // YouTube thumbnails are external URLs (youtube.com or ytimg.com)
    const isDisplayThumbnail = thumbnailUrl.includes('display-thumb') || thumbnailUrl.includes('display.jpg');
    const isYouTubeThumbnail = thumbnailUrl.includes('youtube.com') || thumbnailUrl.includes('ytimg.com');
    
    
    if (isDisplayThumbnail || isYouTubeThumbnail) {
      // Display thumbnails and YouTube thumbnails are already properly formatted at 16:9
      // They should fit perfectly in the aspect-video container
      // Don't use object-fill as it can distort the image
      // Use default img behavior to let the 16:9 image fit naturally
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <img
            src={thumbnailUrl}
            alt={name}
            className="max-w-full max-h-full"
            onError={() => setImageError(true)}
          />
        </div>
      );
    } else {
      // Fallback for non-display thumbnails (shouldn't happen in normal flow)
      const objectFitClass = imageScale === 'cover' ? 'object-cover' : 
                             imageScale === 'fill' ? 'object-fill' : 
                             'object-contain';
      
      const sizeStyle = imageScale === 'contain' && imageSize < 100 
        ? { 
            width: `${imageSize}%`,
            height: `${imageSize}%`,
            maxWidth: '100%',
            maxHeight: '100%'
          }
        : {};
      
      return (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor }}
        >
          <img
            src={thumbnailUrl}
            alt={name}
            className={`${imageScale === 'contain' ? '' : 'w-full h-full'} ${objectFitClass}`}
            style={sizeStyle}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }
  }

  // For PDFs and other content types, show an icon preview
  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor }}
    >
      <div className="text-white/30">
        {getContentIcon(type)}
      </div>
    </div>
  );
}