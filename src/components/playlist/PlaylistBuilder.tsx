'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, Plus, Search, Filter, Grid3x3, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ContentLibrarySidebar, { ContentItem } from './ContentLibrarySidebar';
import PlaylistWorkspace from './PlaylistWorkspace';
import PlaylistPreview from './PlaylistPreview';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { Playlist, PlaylistItem, TransitionEffect } from '@/types/playlist';
import { DragDropWrapper } from './DragDropWrapper';
import { DropResult } from '@hello-pangea/dnd';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';

interface PlaylistBuilderProps {
  playlistId?: string;
  initialPlaylist?: Playlist;
  onSave?: (playlist: Playlist) => void;
  onPreview?: (playlist: Playlist) => void;
}

export function PlaylistBuilder({ 
  playlistId, 
  initialPlaylist,
  onSave, 
  onPreview
}: PlaylistBuilderProps) {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist>(
    initialPlaylist || {
      id: playlistId || '',
      name: 'Untitled Playlist',
      description: '',
      items: [],
      totalDuration: 0,
      createdBy: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      sharedWith: [],
      tags: [],
    }
  );

  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'image' | 'video' | 'pdf'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([]);
  
  // Memoize the content loaded handler to prevent re-renders
  const handleContentLoaded = useCallback((items: ContentItem[]) => {
    setAvailableContent(items);
  }, []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Update playlist when initialPlaylist changes
  useEffect(() => {
    console.log('PlaylistBuilder received initialPlaylist:', initialPlaylist);
    if (initialPlaylist) {
      setPlaylist(initialPlaylist);
      setHasUnsavedChanges(false); // Reset when loading existing playlist
    }
  }, [initialPlaylist]);

  // Calculate total duration whenever items change
  useEffect(() => {
    const total = playlist.items.reduce((sum, item) => sum + item.duration, 0);
    setPlaylist(prev => ({ ...prev, totalDuration: total }));
  }, [playlist.items]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  // Handle navigation attempts with unsaved changes
  const handleNavigationAttempt = useCallback((destination: string) => {
    setPendingNavigation(destination);
    setShowUnsavedDialog(true);
  }, []);

  // Use navigation guard to intercept navigation attempts
  useNavigationGuard({
    hasUnsavedChanges: hasUnsavedChanges && !isSaving,
    onNavigationAttempt: handleNavigationAttempt,
  });

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    if (result.source.index === result.destination.index) return;

    const items = Array.from(playlist.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setPlaylist(prev => ({ ...prev, items: updatedItems }));
    setHasUnsavedChanges(true);
  }, [playlist.items]);

  // Add content to playlist
  const handleAddContent = useCallback((contentId: string, contentData: any) => {
    // Use the duration from the content data if available
    // For YouTube videos, this will be the actual video duration fetched from the API
    // For other content types, use their stored duration or sensible defaults
    let defaultDuration = 10; // Default for images and other content
    
    // Check if duration is explicitly set (including actual video durations)
    if (typeof contentData.duration === 'number' && contentData.duration > 0) {
      // Use the content's actual duration
      defaultDuration = contentData.duration;
    } else if (contentData.duration === 0) {
      // Duration 0 means play full video (for backwards compatibility)
      // But we should have the actual duration in metadata
      if (contentData.metadata?.actualVideoDuration) {
        defaultDuration = contentData.metadata.actualVideoDuration;
      } else {
        defaultDuration = 0; // Will need to be handled specially in player
      }
    } else {
      // Fallback defaults if no duration is set
      switch (contentData.type?.toLowerCase()) {
        case 'video':
        case 'youtube':
          defaultDuration = 30; // Default for videos without duration
          break;
        case 'pdf':
          defaultDuration = 15; // Default for PDFs
          break;
        case 'image':
        default:
          defaultDuration = 10; // Default for images
          break;
      }
    }

    const newItem: PlaylistItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      contentId,
      order: playlist.items.length,
      duration: defaultDuration,
      transition: 'fade',
      transitionDuration: 1,
      title: contentData.title || contentData.name || 'Untitled',
      thumbnail: contentData.thumbnailUrl || contentData.thumbnail,
      contentType: contentData.type || 'image',
      cropSettings: contentData.cropSettings,
      backgroundColor: contentData.backgroundColor,
      imageScale: contentData.metadata?.imageScale || 'contain',
      imageSize: contentData.metadata?.imageSize || 100,
    };

    setPlaylist(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setHasUnsavedChanges(true);
  }, [playlist.items]);

  // Add multiple content items
  const handleBulkAdd = useCallback(() => {
    if (selectedContentIds.size === 0) return;

    // Get the selected content items from available content
    const selectedContent = availableContent.filter(item => selectedContentIds.has(item.id));
    
    const newItems: PlaylistItem[] = selectedContent.map((content, index) => {
      // Use same logic as handleAddContent for consistency
      let defaultDuration = 10;
      
      if (typeof content.duration === 'number' && content.duration > 0) {
        defaultDuration = content.duration;
      } else if (content.metadata?.actualVideoDuration) {
        defaultDuration = content.metadata.actualVideoDuration;
      } else {
        switch (content.type) {
          case 'video':
            defaultDuration = 30;
            break;
          case 'pdf':
            defaultDuration = 15;
            break;
          case 'image':
          default:
            defaultDuration = 10;
            break;
        }
      }
      
      return {
        id: `item-${Date.now()}-${index}`,
        contentId: content.id,
        order: playlist.items.length + index,
        duration: defaultDuration,
        transition: 'fade' as TransitionEffect,
        transitionDuration: 1,
        title: content.title || 'Untitled',
        thumbnail: content.thumbnail,
        contentType: content.type || 'image',
        cropSettings: content.cropSettings,
        backgroundColor: content.backgroundColor,
        imageScale: content.metadata?.imageScale || 'contain',
        imageSize: content.metadata?.imageSize || 100,
      };
    });

    setPlaylist(prev => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }));

    setSelectedContentIds(new Set());
    setHasUnsavedChanges(true);
  }, [selectedContentIds, playlist.items, availableContent]);

  // Remove item from playlist
  const handleRemoveItem = useCallback((itemId: string) => {
    setPlaylist(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index })),
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Update item properties
  const handleUpdateItem = useCallback((itemId: string, updates: Partial<PlaylistItem>) => {
    setPlaylist(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Duplicate item
  const handleDuplicateItem = useCallback((itemId: string) => {
    const itemToDuplicate = playlist.items.find(item => item.id === itemId);
    if (!itemToDuplicate) return;

    const duplicatedItem: PlaylistItem = {
      ...itemToDuplicate,
      id: `item-${Date.now()}-${Math.random()}`,
      order: playlist.items.length,
    };

    setPlaylist(prev => ({
      ...prev,
      items: [...prev.items, duplicatedItem],
    }));
    setHasUnsavedChanges(true);
  }, [playlist.items]);

  // Save playlist
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(playlist);
        setHasUnsavedChanges(false); // Reset after successful save
      }
      // Show success toast
    } catch (error) {
      console.error('Failed to save playlist:', error);
      // Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  // Handle navigation with unsaved changes
  const handleNavigate = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      router.push(path);
    }
  };

  // Confirm navigation without saving
  const confirmNavigation = () => {
    setShowUnsavedDialog(false);
    setHasUnsavedChanges(false); // Clear flag to allow navigation
    if (pendingNavigation) {
      // Navigate after clearing the flag
      setTimeout(() => {
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }, 0);
    }
  };

  // Cancel navigation
  const cancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={playlist.name}
              onChange={(e) => {
                setPlaylist(prev => ({ ...prev, name: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="text-2xl font-bold bg-transparent text-white border-b border-white/20 focus:border-brand-orange-500 outline-none px-2"
              placeholder="Playlist Name"
            />
            <span className="text-white/70">
              {playlist.items.length} items • {formatDuration(playlist.totalDuration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleNavigate('/playlists')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowPreview(true)}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || playlist.items.length === 0}
              className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Playlist'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Content Library Sidebar */}
        <div className="w-1/3 min-w-[300px] max-w-[500px] border-r border-white/20 bg-white/5 flex flex-col">
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <Button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </Button>
            </div>

            {/* Content Type Filter */}
            <div className="flex gap-2">
              {(['all', 'image', 'video', 'pdf'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setContentTypeFilter(type)}
                  className={`px-3 py-1 rounded text-sm transition ${
                    contentTypeFilter === type
                      ? 'bg-brand-orange-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ContentLibrarySidebar
              searchQuery={searchQuery}
              contentTypeFilter={contentTypeFilter}
              viewMode={viewMode}
              selectedIds={selectedContentIds}
              onSelectContent={(id) => {
                const newSelected = new Set(selectedContentIds);
                if (newSelected.has(id)) {
                  newSelected.delete(id);
                } else {
                  newSelected.add(id);
                }
                setSelectedContentIds(newSelected);
              }}
              onAddToPlaylist={handleAddContent}
              onContentLoaded={handleContentLoaded}
            />
          </div>

          {/* Bulk Actions */}
          {selectedContentIds.size > 0 && (
            <div className="p-4 border-t border-white/20 bg-white/10 flex-shrink-0">
              <Button
                onClick={handleBulkAdd}
                className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add {selectedContentIds.size} Selected Items
              </Button>
            </div>
          )}
        </div>

        {/* Playlist Workspace */}
        <div className="flex-1 overflow-hidden">
          <DragDropWrapper onDragEnd={handleDragEnd}>
            <PlaylistWorkspace
              playlist={playlist}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
              onDuplicateItem={handleDuplicateItem}
            />
          </DragDropWrapper>
        </div>
      </div>

      {/* Playlist Preview Modal */}
      <PlaylistPreview
        playlist={playlist}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onFullscreen={() => {
          setShowPreview(false);
          onPreview?.(playlist);
        }}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </div>
  );
}

export default PlaylistBuilder;