'use client';

import { useState, useEffect } from 'react';
import { Image, Video, FileText, Plus, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContentThumbnail } from '@/components/content/ContentThumbnail';
import { apiToFrontendContent } from '@/lib/transformers/api-transformers';

export interface ContentItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'pdf';
  thumbnail?: string;
  duration?: number;
  size: number;
  uploadedAt: Date;
  cropSettings?: any;
  backgroundColor?: string;
  metadata?: any;  // Add metadata field
}

interface ContentLibrarySidebarProps {
  searchQuery: string;
  contentTypeFilter: 'all' | 'image' | 'video' | 'pdf';
  viewMode: 'grid' | 'list';
  selectedIds: Set<string>;
  onSelectContent: (id: string) => void;
  onAddToPlaylist: (contentId: string, contentData: any) => void;
  onContentLoaded?: (items: ContentItem[]) => void;
}

export function ContentLibrarySidebar({
  searchQuery,
  contentTypeFilter,
  viewMode,
  selectedIds,
  onSelectContent,
  onAddToPlaylist,
  onContentLoaded,
}: ContentLibrarySidebarProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real content from API
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/content?sortBy=createdAt&sortOrder=desc');
        if (!response.ok) throw new Error('Failed to fetch content');
        
        const data = await response.json();
        
        // Transform API data using the proper transformer first
        const frontendContent = Array.isArray(data)
          ? data.map(apiToFrontendContent)
          : [];
        
        // Then transform to match component's expected format
        const transformedContent: ContentItem[] = frontendContent.map((item: any) => {
          return {
            id: item.id,
            title: item.name || 'Untitled',
            type: (item.type?.toLowerCase() || 'image') as 'image' | 'video' | 'pdf',
            thumbnail: item.thumbnailUrl || '/api/placeholder/150/150',
            duration: item.duration || item.metadata?.duration, // Use content duration first, then metadata
            size: parseInt(item.fileSize || '0'),
            uploadedAt: new Date(item.createdAt),
            cropSettings: item.cropSettings, // Include cropSettings
            backgroundColor: item.backgroundColor || '#000000',
            metadata: item.metadata, // Include metadata for imageScale and imageSize
          };
        });
        setContentItems(transformedContent);
        // Notify parent component of loaded content
        if (onContentLoaded) {
          onContentLoaded(transformedContent);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        // Fallback to empty array on error
        setContentItems([]);
        if (onContentLoaded) {
          onContentLoaded([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []); // Only run once on mount

  // Filter content based on search and type
  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = contentTypeFilter === 'all' || item.type === contentTypeFilter;
    return matchesSearch && matchesType;
  });

  // Get icon for content type
  const getContentIcon = (type: 'image' | 'video' | 'pdf') => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
    }
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/50">Loading content...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 p-4">
          {filteredContent.map(item => (
            <div
              key={item.id}
              className={`relative group bg-white/10 rounded-lg overflow-hidden transition-all cursor-pointer ${
                selectedIds.has(item.id) ? 'ring-2 ring-brand-orange-500' : 'hover:bg-white/20'
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-black relative overflow-hidden">
                <ContentThumbnail
                  type={item.type}
                  thumbnailUrl={item.thumbnail}
                  name={item.title}
                  backgroundColor={item.backgroundColor || '#000000'}
                  imageScale={item.metadata?.imageScale || 'contain'}
                  imageSize={item.metadata?.imageSize || 100}
                />

                {/* Selection checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectContent(item.id);
                  }}
                  className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                    selectedIds.has(item.id)
                      ? 'bg-brand-orange-500 border-brand-orange-500'
                      : 'bg-black/50 border-white/50 hover:border-white'
                  }`}
                >
                  {selectedIds.has(item.id) && <Check className="w-4 h-4 text-white" />}
                </button>

                {/* Quick add button */}
                <button
                  onClick={() => onAddToPlaylist(item.id, {
                    ...item,
                    name: item.title,
                    thumbnailUrl: item.thumbnail,
                  })}
                  className="absolute top-2 right-2 p-1.5 bg-brand-orange-500 text-white rounded opacity-0 group-hover:opacity-100 transition hover:bg-brand-orange-600"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Duration badge for videos */}
                {item.type === 'video' && item.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {formatDuration(item.duration)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <div className="text-white/70 mt-0.5">{getContentIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">{item.title}</h4>
                    <p className="text-white/50 text-xs">{formatSize(item.size)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {filteredContent.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition cursor-pointer ${
                selectedIds.has(item.id)
                  ? 'bg-brand-orange-500/20 ring-1 ring-brand-orange-500'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {/* Selection checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectContent(item.id);
                }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                  selectedIds.has(item.id)
                    ? 'bg-brand-orange-500 border-brand-orange-500'
                    : 'bg-transparent border-white/50 hover:border-white'
                }`}
              >
                {selectedIds.has(item.id) && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* Icon */}
              <div className="text-white/70">{getContentIcon(item.type)}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-medium truncate">{item.title}</h4>
                <div className="flex items-center gap-3 text-white/50 text-xs">
                  <span>{formatSize(item.size)}</span>
                  {item.type === 'video' && item.duration && (
                    <span>{formatDuration(item.duration)}</span>
                  )}
                </div>
              </div>

              {/* Quick add button */}
              <button
                onClick={() => onAddToPlaylist(item.id, {
                  ...item,
                  name: item.title,
                  thumbnailUrl: item.thumbnail,
                })}
                className="p-1.5 bg-brand-orange-500 text-white rounded hover:bg-brand-orange-600 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {filteredContent.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-white/30 mb-2">No content found</div>
          <p className="text-white/50 text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </ScrollArea>
  );
}

export default ContentLibrarySidebar;
