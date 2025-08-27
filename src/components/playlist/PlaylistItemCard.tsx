'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Copy, Image, Video, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlaylistItem, TRANSITION_EFFECTS } from '@/types/playlist';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { DurationInput } from './DurationInput';

interface PlaylistItemCardProps {
  item: PlaylistItem;
  index: number;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onUpdate: (updates: Partial<PlaylistItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function PlaylistItemCard({
  item,
  index,
  dragHandleProps,
  onUpdate,
  onRemove,
  onDuplicate,
}: PlaylistItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get icon for content type
  const getContentIcon = () => {
    switch (item.contentType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
    }
  };


  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
      {/* Main Row */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Index */}
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-medium">
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div className="w-16 h-16 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="text-white/30">{getContentIcon()}</div>
          )}
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-white/70">{getContentIcon()}</div>
            <h4 className="text-white font-medium truncate">{item.title}</h4>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/50">Duration:</span>
              <DurationInput
                value={item.duration}
                onChange={(value) => onUpdate({ duration: value })}
                min={1}
                max={3600}
                format="auto"
                showButtons={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/50">Transition:</span>
              <span className="text-white">{item.transition}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={onDuplicate}
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            onClick={onRemove}
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Transition Effect */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">
                Transition Effect
              </label>
              <Select
                value={item.transition}
                onValueChange={(value) => onUpdate({ transition: value as any })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-gray-900 border-white/20">
                  {TRANSITION_EFFECTS.map((effect) => (
                    <SelectItem
                      key={effect.value}
                      value={effect.value}
                      className="text-white hover:bg-white/10"
                    >
                      <div>
                        <div className="font-medium">{effect.label}</div>
                        <div className="text-xs text-white/50">{effect.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transition Duration */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">
                Transition Duration
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={item.transitionDuration}
                  onChange={(e) => onUpdate({ transitionDuration: parseFloat(e.target.value) || 1 })}
                  className="bg-white/10 border-white/20 text-white"
                />
                <span className="text-white/50 text-sm">seconds</span>
              </div>
            </div>
          </div>

          {/* Crop Settings Info */}
          {item.cropSettings && (
            <div className="mt-4 p-3 bg-white/5 rounded">
              <div className="text-white/70 text-sm mb-1">Crop Settings Applied</div>
              <div className="text-white/50 text-xs">
                Custom crop and zoom settings are configured for this content
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlaylistItemCard;