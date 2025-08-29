'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Copy, Clock, Sparkles } from 'lucide-react';
import { Playlist, PlaylistItem } from '@/types/playlist';
import PlaylistItemCard from './PlaylistItemCard';

interface PlaylistWorkspaceProps {
  playlist: Playlist;
  onUpdateItem: (itemId: string, updates: Partial<PlaylistItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
}

export function PlaylistWorkspace({
  playlist,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
}: PlaylistWorkspaceProps) {
  // Format total duration
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

  if (playlist.items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white/30" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Your playlist is empty
          </h3>
          <p className="text-white/50 max-w-md">
            Start building your playlist by adding content from the library on the left.
            You can drag and drop items to reorder them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Playlist Stats Bar */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/70" />
              <span className="text-white">
                Total Duration: <strong>{formatDuration(playlist.totalDuration)}</strong>
              </span>
            </div>
            <div className="text-white/70">
              {playlist.items.length} {playlist.items.length === 1 ? 'item' : 'items'}
            </div>
          </div>
          
          {playlist.description && (
            <div className="text-white/50 text-sm max-w-md truncate">
              {playlist.description}
            </div>
          )}
        </div>
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto">
        <Droppable droppableId="playlist-items">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-3 min-h-full p-4"
            >
              {playlist.items.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                      className={snapshot.isDragging ? 'dragging-item' : ''}
                    >
                      <PlaylistItemCard
                        item={item}
                        index={index}
                        dragHandleProps={null}
                        onUpdate={(updates) => onUpdateItem(item.id, updates)}
                        onRemove={() => onRemoveItem(item.id)}
                        onDuplicate={() => onDuplicateItem(item.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}

export default PlaylistWorkspace;