'use client';

import { ContentType } from '@/generated/prisma';
import { FileText, Film, Image as ImageIcon, Link, Youtube, Type, Check, MoreVertical, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
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
  type: ContentType;
  thumbnailUrl?: string;
  fileSize?: bigint;
  createdAt: string;
  metadata?: any;
  mimeType?: string;
  description?: string | null;
  duration?: number;
}

interface ContentListProps {
  content: ContentItem[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (itemId: string) => void;
}

export function ContentList({ content, selectedItems, onSelectionChange, onEdit, onDelete }: ContentListProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.IMAGE:
        return <ImageIcon className="w-5 h-5" />;
      case ContentType.VIDEO:
        return <Film className="w-5 h-5" />;
      case ContentType.PDF:
        return <FileText className="w-5 h-5" />;
      case ContentType.URL:
        return <Link className="w-5 h-5" />;
      case ContentType.YOUTUBE:
        return <Youtube className="w-5 h-5" />;
      case ContentType.TEXT:
        return <Type className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: bigint | undefined) => {
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const toggleAll = () => {
    if (selectedItems.length === content.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(content.map(item => item.id));
    }
  };

  return (
    <>
    <div className="overflow-x-auto">
      <table className="w-full text-white">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left p-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition ${
                  selectedItems.length === content.length && content.length > 0
                    ? 'bg-brand-orange-500 border-brand-orange-500'
                    : selectedItems.length > 0
                    ? 'bg-brand-orange-500/50 border-brand-orange-500'
                    : 'bg-white/10 border-white/30 hover:border-white/50'
                }`}
                onClick={toggleAll}
              >
                {selectedItems.length === content.length && content.length > 0 && (
                  <Check className="w-3 h-3 text-white" />
                )}
                {selectedItems.length > 0 && selectedItems.length < content.length && (
                  <div className="w-2 h-2 bg-white rounded-sm" />
                )}
              </div>
            </th>
            <th className="text-left p-3">Type</th>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Size</th>
            <th className="text-left p-3">Duration/Pages</th>
            <th className="text-left p-3">Created</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {content.map((item) => {
            const isSelected = selectedItems.includes(item.id);

            return (
              <tr
                key={item.id}
                className={`border-b border-white/10 hover:bg-white/5 transition cursor-pointer ${
                  isSelected ? 'bg-white/10' : ''
                }`}
                onClick={() => toggleSelection(item.id)}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition ${
                      isSelected
                        ? 'bg-brand-orange-500 border-brand-orange-500'
                        : 'bg-white/10 border-white/30 hover:border-white/50'
                    }`}
                    onClick={() => toggleSelection(item.id)}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 text-white/70">
                    {getContentIcon(item.type)}
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    {item.mimeType && (
                      <p className="text-xs text-white/50 mt-1">{item.mimeType}</p>
                    )}
                  </div>
                </td>
                <td className="p-3 text-white/70">
                  {formatFileSize(item.fileSize)}
                </td>
                <td className="p-3 text-white/70">
                  {item.metadata?.duration && (
                    <span>
                      {Math.floor(item.metadata.duration / 60)}:{String(item.metadata.duration % 60).padStart(2, '0')}
                    </span>
                  )}
                  {item.metadata?.pages && (
                    <span>{item.metadata.pages} pages</span>
                  )}
                  {!item.metadata?.duration && !item.metadata?.pages && '-'}
                </td>
                <td className="p-3 text-white/70">
                  {formatDate(item.createdAt)}
                </td>
                <td className="p-3 relative">
                  <button
                    className="p-2 hover:bg-white/10 rounded transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === item.id ? null : item.id);
                    }}
                  >
                    <MoreVertical className="w-4 h-4 text-white/70" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openDropdown === item.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-brand-gray-900/95 border border-white/20 rounded-lg shadow-xl z-10">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete({ id: item.id, name: item.name });
                            setDeleteConfirmOpen(true);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20 transition flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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