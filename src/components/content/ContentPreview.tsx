'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Download, Palette, Play, FileText } from 'lucide-react';
import { ChromePicker } from 'react-color';
import { ContentType } from '@/generated/prisma';

interface ContentPreviewProps {
  content: {
    id: string;
    name: string;
    type: ContentType;
    filePath?: string;
    url?: string;
    thumbnailUrl?: string;
    backgroundColor?: string;
    metadata?: any;
  };
  onClose: () => void;
  onBackgroundColorChange?: (color: string) => void;
}

export function ContentPreview({ content, onClose, onBackgroundColorChange }: ContentPreviewProps) {
  const [backgroundColor, setBackgroundColor] = useState(content.backgroundColor || '#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    // Generate preview URL based on content type
    if (content.type === ContentType.YOUTUBE && content.url) {
      // Extract YouTube video ID
      const videoId = extractYouTubeId(content.url);
      if (videoId) {
        setPreviewUrl(`https://www.youtube.com/embed/${videoId}`);
      }
    } else if (content.filePath) {
      // For local files, use API endpoint
      setPreviewUrl(`/api/content/${content.id}/file`);
    } else if (content.url) {
      setPreviewUrl(content.url);
    }
  }, [content]);

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleColorChange = (color: any) => {
    setBackgroundColor(color.hex);
  };

  const applyBackgroundColor = async () => {
    if (onBackgroundColorChange) {
      onBackgroundColorChange(backgroundColor);
    }
    
    // Save to backend
    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundColor }),
      });
      
      if (!response.ok) {
        console.error('Failed to update background color');
      }
    } catch (error) {
      console.error('Error updating background color:', error);
    }
    
    setShowColorPicker(false);
  };

  const handleDownload = () => {
    if (content.filePath) {
      window.open(`/api/content/${content.id}/download`, '_blank');
    }
  };

  const renderPreview = () => {
    switch (content.type) {
      case ContentType.IMAGE:
        return (
          <div 
            className="relative w-full h-full flex items-center justify-center"
            style={{ backgroundColor }}
          >
            {previewUrl && (
              <Image
                src={previewUrl}
                alt={content.name}
                fill
                className="object-contain"
              />
            )}
          </div>
        );

      case ContentType.VIDEO:
        return (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              src={previewUrl}
              controls
              className="w-full h-full"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case ContentType.YOUTUBE:
        return (
          <div className="relative w-full h-full">
            <iframe
              src={previewUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case ContentType.PDF:
        return (
          <div className="relative w-full h-full">
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title={content.name}
            />
          </div>
        );

      case ContentType.URL:
        return (
          <div className="relative w-full h-full">
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title={content.name}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" />
              <p>Preview not available for this content type</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{content.name}</h2>
              <div className="flex gap-4 text-sm text-white/70">
                <span>Type: {content.type}</span>
                {content.metadata?.duration && (
                  <span>
                    Duration: {Math.floor(content.metadata.duration / 60)}:{String(content.metadata.duration % 60).padStart(2, '0')}
                  </span>
                )}
                {content.metadata?.pages && (
                  <span>Pages: {content.metadata.pages}</span>
                )}
                {content.metadata?.width && content.metadata?.height && (
                  <span>{content.metadata.width} × {content.metadata.height}</span>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 mt-20 mb-20 px-8">
          {renderPreview()}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex justify-center gap-4">
            {/* Background Color Picker for Images */}
            {content.type === ContentType.IMAGE && (
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                >
                  <Palette className="w-5 h-5" />
                  <span>Background Color</span>
                  <div
                    className="w-6 h-6 rounded border border-white/50"
                    style={{ backgroundColor }}
                  />
                </button>
                
                {showColorPicker && (
                  <div className="absolute bottom-full mb-2 left-0 z-20">
                    <div className="bg-white rounded-lg shadow-xl p-3">
                      <ChromePicker
                        color={backgroundColor}
                        onChange={handleColorChange}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setShowColorPicker(false)}
                          className="flex-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={applyBackgroundColor}
                          className="flex-1 px-3 py-1 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Download Button */}
            {content.filePath && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}