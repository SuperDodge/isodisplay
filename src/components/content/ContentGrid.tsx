'use client';

import { useState } from 'react';
import { ContentType } from '@/generated/prisma';
import { Check, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { ContentThumbnail } from './ContentThumbnail';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContentItem {
  id: string;
  name: string;
  type: ContentType | string;  // Can be enum or string from transformer
  thumbnailUrl?: string;
  fileSize?: bigint;
  createdAt: string;
  metadata?: any;
  description?: string | null;
  duration?: number;
  backgroundColor?: string | null;
}

interface ContentGridProps {
  content: ContentItem[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (itemId: string) => void;
}

export function ContentGrid({ content, selectedItems, onSelectionChange, onEdit, onDelete }: ContentGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const formatFileSize = (bytes: bigint | undefined, type?: ContentType | string) => {
    if (type === ContentType.YOUTUBE || type === 'youtube' || type === 'YOUTUBE') return 'YT';
    if (!bytes) return 'N/A';
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {content.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        const isHovered = hoveredItem === item.id;

        return (
          <div
            key={item.id}
            className={`relative group bg-white/5 rounded-lg border-2 shadow-lg transition-all cursor-pointer ${
              isSelected
                ? 'border-brand-orange-500 ring-2 ring-brand-orange-500/50 shadow-brand-orange-500/20'
                : 'border-white/20 hover:border-white/30 hover:shadow-xl'
            }`}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => toggleSelection(item.id)}
          >
            {/* Selection Checkbox */}
            <div
              className={`absolute top-3 left-3 z-10 w-7 h-7 rounded border-2 flex items-center justify-center transition ${
                isSelected
                  ? 'bg-brand-orange-500 border-brand-orange-500'
                  : 'bg-white/10 border-white/30'
              }`}
            >
              {isSelected && <Check className="w-5 h-5 text-white" />}
            </div>

            {/* Thumbnail - Exactly as displayed */}
            <div className="aspect-video relative bg-black rounded-t-lg overflow-hidden">
              <ContentThumbnail
                type={item.type}
                thumbnailUrl={item.thumbnailUrl}
                name={item.name}
                backgroundColor={item.backgroundColor || '#000000'}
                imageScale={item.metadata?.imageScale || 'contain'}
                imageSize={item.metadata?.imageSize || 100}
                metadata={item.metadata}
              />

              {/* Type Badge */}
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium capitalize ${
                item.type === 'video' || item.type === ContentType.VIDEO
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : item.type === 'youtube' || item.type === ContentType.YOUTUBE
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : item.type === 'pdf' || item.type === ContentType.PDF
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : item.type === 'url' || item.type === ContentType.URL
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : item.type === 'text' || item.type === ContentType.TEXT
                          ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {item.type === 'youtube' || item.type === ContentType.YOUTUBE ? 'YouTube' : 
                 item.type === 'video' || item.type === ContentType.VIDEO ? 'Video' :
                 item.type === 'image' || item.type === ContentType.IMAGE ? 'Image' :
                 item.type === 'pdf' || item.type === ContentType.PDF ? 'PDF' :
                 item.type === 'url' || item.type === ContentType.URL ? 'URL' :
                 item.type === 'text' || item.type === ContentType.TEXT ? 'Text' : 
                 'Image'}
              </div>

              {/* Hover Overlay with Actions */}
              {isHovered && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition"
                      title="Edit content"
                    >
                      <Edit className="w-5 h-5 text-white" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ id: item.id, name: item.name });
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                      title="Delete content"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content Info */}
            <div className="p-4">
              <h3 className="text-white font-semibold text-base truncate mb-2" title={item.name}>
                {item.name}
              </h3>
              <div className="flex justify-between items-center text-sm text-white/50">
                <span>{formatFileSize(item.fileSize, item.type)}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              {/* Show duration for all content types that have it */}
              {(item.duration || item.metadata?.duration) && (
                <div className="mt-2 text-sm text-white/50">
                  Duration: {(() => {
                    const duration = item.duration || item.metadata?.duration || 0;
                    if (duration >= 60) {
                      return `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
                    }
                    return `${duration}s`;
                  })()}
                </div>
              )}
              {item.metadata?.pages && (
                <div className="mt-2 text-sm text-white/50">
                  Pages: {item.metadata.pages}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent className="bg-red-500/20 backdrop-blur-md border-red-500/50 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-white text-lg">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <span style={{ 
              fontFamily: 'Made Tommy, sans-serif', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              letterSpacing: '0.01em' 
            }}>
              Delete Content
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-red-300 pt-2 font-body">
            Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="text-white hover:bg-white/10 hover:text-white font-body"
            onClick={() => setItemToDelete(null)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              if (itemToDelete && onDelete) {
                onDelete(itemToDelete.id);
              }
              setItemToDelete(null);
              setDeleteConfirmOpen(false);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-body"
          >
            Delete Content
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}