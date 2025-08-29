'use client';

import { GripVertical, Trash2, Copy, Image, Video, FileText } from 'lucide-react';
import { ContentThumbnail } from '@/components/content/ContentThumbnail';
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
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
      <div className="flex items-start gap-3">
        {/* Left side - Drag, Index, Thumbnail */}
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          {dragHandleProps ? (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition mt-4"
            >
              <GripVertical className="w-5 h-5" />
            </div>
          ) : (
            <div className="text-white/50 mt-4">
              <GripVertical className="w-5 h-5" />
            </div>
          )}

          {/* Index */}
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-medium mt-3">
            {index + 1}
          </div>

          {/* Thumbnail - 16:9 aspect ratio, larger */}
          <div className="w-32 h-[72px] rounded bg-black flex items-center justify-center flex-shrink-0 overflow-hidden">
            <ContentThumbnail
              type={item.contentType || 'image'}
              thumbnailUrl={item.thumbnail}
              name={item.title}
              backgroundColor={item.backgroundColor || '#000000'}
              imageScale={item.imageScale || 'contain'}
              imageSize={item.imageSize || 100}
            />
          </div>
        </div>

        {/* Right side - Content info and controls */}
        <div className="flex-1 space-y-3">
          {/* Title Row */}
          <div className="flex items-center gap-2 pt-1">
            <div className="text-white/70">{getContentIcon()}</div>
            <h4 className="text-white font-medium truncate flex-1">{item.title}</h4>
            {/* Content Type Badge */}
            <div className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
              item.contentType === 'video' 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : item.contentType === 'youtube'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : item.contentType === 'pdf'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {item.contentType === 'youtube' ? 'YouTube' : item.contentType || 'image'}
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center">
            {/* Duration */}
            <div className="flex items-center gap-1.5">
              <label className="text-white/50 text-xs">Duration</label>
              {item.contentType === 'video' || item.contentType === 'youtube' ? (
                <div className="bg-white/10 border border-white/20 rounded h-10 flex items-center justify-center w-20">
                  <span className="text-white text-sm">
                    {item.duration >= 3600 
                      ? `${Math.floor(item.duration / 3600)}:${String(Math.floor((item.duration % 3600) / 60)).padStart(2, '0')}:${String(item.duration % 60).padStart(2, '0')}`
                      : item.duration >= 60 
                        ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}`
                        : `${item.duration}s`}
                  </span>
                </div>
              ) : (
                <DurationInput
                  value={item.duration}
                  onChange={(value) => onUpdate({ duration: value })}
                  min={1}
                  max={3600}
                  format="auto"
                  showButtons={false}
                  className="w-20"
                />
              )}
            </div>

            {/* Center padding/spacer */}
            <div className="flex-1" />

            {/* Transition Effect and Duration */}
            <div className="flex items-center gap-1.5">
              <label className="text-white/50 text-xs">Transition</label>
              <Select
                value={item.transition}
                onValueChange={(value) => onUpdate({ transition: value as any })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-8 text-sm w-64 [&>span]:flex [&>span]:justify-center [&>span]:w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-gray-900 border-white/20 max-w-md">
                  {TRANSITION_EFFECTS.map((effect) => (
                    <SelectItem
                      key={effect.value}
                      value={effect.value}
                      className="text-white hover:bg-white/10"
                    >
                      <div>
                        <div className="font-medium text-sm">{effect.label}</div>
                        <div className="text-xs text-white/50">{effect.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-white/50 text-xs">for</span>
              <input
                type="text"
                value={item.transitionDuration}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow typing decimal numbers
                  if (/^\d*\.?\d*$/.test(value)) {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 5) {
                      onUpdate({ transitionDuration: parsed });
                    } else if (value === '' || value === '.') {
                      // Allow empty or just decimal point while typing
                      onUpdate({ transitionDuration: parseFloat(value) || 1 });
                    }
                  }
                }}
                onBlur={(e) => {
                  // Ensure valid value on blur
                  const parsed = parseFloat(e.target.value);
                  if (isNaN(parsed) || parsed < 0.1 || parsed > 5) {
                    onUpdate({ transitionDuration: 1 });
                  }
                }}
                className="bg-white/10 border border-white/20 rounded text-white text-sm text-center outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 focus:ring-offset-transparent focus:border-white transition-all"
                style={{ 
                  appearance: 'textfield',
                  width: '2.5rem',
                  height: '2rem',
                  padding: '0 0.25rem'
                }}
                placeholder="1"
              />
              <span className="text-white/50 text-xs">sec</span>
            </div>

            {/* Right padding/spacer */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                onClick={onDuplicate}
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                onClick={onRemove}
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Crop Settings Info - inline if present */}
          {item.cropSettings && (
            <div className="text-white/50 text-xs">
              Custom crop settings applied
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaylistItemCard;