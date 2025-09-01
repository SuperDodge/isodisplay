'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContentType } from '@/generated/prisma';
import { useCSRF } from '@/hooks/useCSRF';

interface ContentItem {
  id: string;
  name: string;
  type: ContentType;
  description?: string | null;
  duration?: number;
  metadata?: any;
  backgroundColor?: string | null;
  url?: string | null;
  filePath?: string | null;
}

interface ContentEditModalProps {
  content: ContentItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContentEditModal({ content, onClose, onSuccess }: ContentEditModalProps) {
  const { secureFetch } = useCSRF();
  // Get the actual YouTube video duration from metadata if available
  const getYouTubeDuration = () => {
    if (content.type?.toUpperCase() === ContentType.YOUTUBE) {
      // Try to get actual video duration from metadata
      if (content.metadata?.actualVideoDuration) {
        return content.metadata.actualVideoDuration;
      }
      // Fallback to duration field if available
      if (content.metadata?.duration) {
        return content.metadata.duration;
      }
    }
    return content.duration || 0;
  };

  const [formData, setFormData] = useState({
    name: content.name,
    description: content.description || '',
    duration: getYouTubeDuration(),
    backgroundColor: content.backgroundColor || '#000000',
    imageScale: (content.metadata as any)?.imageScale || 'contain',
    imageSize: (content.metadata as any)?.imageSize || 100,
    pdfScale: (content.metadata as any)?.pdfScale || 'contain',
    pdfSize: (content.metadata as any)?.pdfSize || 100,
    pdfAutoPaging: (content.metadata as any)?.pdfAutoPaging ?? true,
    pdfPages: (content.metadata as any)?.pdfPages || '',
    pdfPageDuration: (content.metadata as any)?.pdfPageDuration || 10,
    url: content.type?.toUpperCase() === ContentType.YOUTUBE ? (content.filePath || content.url || '') : (content.url || ''),
    textContent: (content.metadata as any)?.content || '',
    fontSize: (content.metadata as any)?.fontSize || '3rem',
    fontColor: (content.metadata as any)?.fontColor || '#ffffff',
    textAlign: (content.metadata as any)?.textAlign || 'center',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build the update payload, excluding undefined values
      const updatePayload: any = {
        name: formData.name,
        description: formData.description || null,
        // Don't update duration for YouTube videos as it's determined by the video itself
        duration: content.type.toUpperCase() === ContentType.YOUTUBE ? undefined : formData.duration,
      };

      // Add type-specific fields (check both uppercase and lowercase)
      const contentType = content.type.toUpperCase();
      if (contentType === ContentType.IMAGE) {
        updatePayload.backgroundColor = formData.backgroundColor;
        updatePayload.metadata = {
          imageScale: formData.imageScale,
          imageSize: formData.imageSize
        };
      } else if (contentType === ContentType.PDF) {
        updatePayload.backgroundColor = formData.backgroundColor;
        updatePayload.metadata = {
          ...(content.metadata || {}),
          pdfScale: formData.pdfScale,
          pdfSize: formData.pdfSize,
          pdfAutoPaging: !!formData.pdfAutoPaging,
          pdfPages: (formData.pdfPages || '').trim(),
          pdfPageDuration: Number(formData.pdfPageDuration) || 10,
        };
      } else if (contentType === ContentType.YOUTUBE) {
        // For YouTube, store URL in filePath and extract videoId for metadata
        updatePayload.filePath = formData.url;
        
        // Extract video ID from URL
        const videoIdMatch = formData.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          updatePayload.metadata = {
            ...(content.metadata || {}),
            videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/2.jpg`
          };
        }
      } else if (contentType === ContentType.TEXT) {
        updatePayload.metadata = {
          content: formData.textContent,
          fontSize: formData.fontSize,
          fontColor: formData.fontColor,
          textAlign: formData.textAlign
        };
      }

      const response = await secureFetch(`/api/content/${content.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Update content error:', data);
        
        // Handle validation errors with details
        if (data.code === 'VALIDATION_ERROR' && data.details) {
          const errorMessages = data.details.map((d: any) => 
            `${d.field ? d.field + ': ' : ''}${d.message}`
          ).join(', ');
          throw new Error(errorMessages || data.error || 'Failed to update content');
        }
        
        throw new Error(data.error || 'Failed to update content');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white/[0.02] backdrop-blur-xl backdrop-saturate-150 rounded-lg shadow-2xl w-full max-w-md border-2 border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Edit Content</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Content Type Display */}
          <div>
            <Label className="text-white/70 text-sm">Type</Label>
            <div className="mt-1 px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white/50">
              {content.type}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-white/70 text-sm">
              Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
              placeholder="Enter content name"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-white/70 text-sm">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
              placeholder="Enter content description"
              rows={3}
            />
          </div>

          {/* Duration for YouTube (non-editable) */}
          {content.type.toUpperCase() === ContentType.YOUTUBE && (
            <div>
              <Label htmlFor="duration" className="text-white/70 text-sm">
                Duration
              </Label>
              <div className="mt-1 px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white/70">
                {formData.duration > 0 ? (
                  <>
                    {Math.floor(formData.duration / 60)}:{String(formData.duration % 60).padStart(2, '0')} 
                    <span className="text-white/50 ml-2">({formData.duration} seconds)</span>
                  </>
                ) : (
                  <span className="text-white/50">Duration unavailable</span>
                )}
              </div>
              <p className="text-white/50 text-xs mt-1">
                YouTube video duration is automatically determined
              </p>
            </div>
          )}

          {/* Duration for local videos (editable) */}
          {content.type.toUpperCase() === ContentType.VIDEO && (
            <div>
              <Label htmlFor="duration" className="text-white/70 text-sm">
                Duration (seconds)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="Enter duration in seconds"
                min="0"
              />
            </div>
          )}

          {/* Default Duration for other types */}
          {(content.type.toUpperCase() === ContentType.IMAGE || 
            content.type.toUpperCase() === ContentType.TEXT) && (
            <div>
              <Label htmlFor="duration" className="text-white/70 text-sm">
                Display Duration (seconds)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="How long to display (0 for default)"
                min="0"
              />
            </div>
          )}

          {/* Image Display Settings */}
          {content.type.toUpperCase() === ContentType.IMAGE && (
            <>
              {/* Background Color Picker */}
              <div>
                <Label className="text-white/70 text-sm">Background Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer border-2 border-white/10"
                  />
                  <Input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                  />
                </div>
              </div>

              {/* Image Scale Options */}
              <div>
                <Label className="text-white/70 text-sm">Image Scale</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageScale: 'contain' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.imageScale === 'contain'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageScale: 'cover' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.imageScale === 'cover'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageScale: 'fill' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.imageScale === 'fill'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Stretch
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  {formData.imageScale === 'contain' && 'Image will fit within display, maintaining aspect ratio'}
                  {formData.imageScale === 'cover' && 'Image will fill display, cropping if necessary'}
                  {formData.imageScale === 'fill' && 'Image will stretch to fill entire display'}
                </p>
              </div>

              {/* Image Size Slider (only for Fit mode) */}
              {formData.imageScale === 'contain' && (
                <div>
                  <Label className="text-white/70 text-sm">
                    Image Size: {formData.imageSize}%
                  </Label>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={formData.imageSize}
                      onChange={(e) => setFormData({ ...formData, imageSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #f56600 0%, #f56600 ${formData.imageSize}%, rgba(255, 255, 255, 0.2) ${formData.imageSize}%, rgba(255, 255, 255, 0.2) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PDF Display Settings */}
          {content.type.toUpperCase() === ContentType.PDF && (
            <>
              {/* Background Color Picker */}
              <div>
                <Label className="text-white/70 text-sm">Background Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer border-2 border-white/10"
                  />
                  <Input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                  />
                </div>
              </div>

              {/* PDF Scale Options */}
              <div>
                <Label className="text-white/70 text-sm">PDF Scale</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pdfScale: 'contain' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.pdfScale === 'contain'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pdfScale: 'cover' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.pdfScale === 'cover'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pdfScale: 'fill' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.pdfScale === 'fill'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Stretch
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  {formData.pdfScale === 'contain' && 'PDF will fit within display, maintaining aspect ratio'}
                  {formData.pdfScale === 'cover' && 'PDF will fill display, cropping if necessary'}
                  {formData.pdfScale === 'fill' && 'PDF will stretch to fill entire display'}
                </p>
              </div>

              {/* PDF Size Slider (only for Fit mode) */}
              {formData.pdfScale === 'contain' && (
                <div>
                  <Label className="text-white/70 text-sm">
                    PDF Size: {formData.pdfSize}%
                  </Label>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={formData.pdfSize}
                      onChange={(e) => setFormData({ ...formData, pdfSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #f56600 0%, #f56600 ${formData.pdfSize}%, rgba(255, 255, 255, 0.2) ${formData.pdfSize}%, rgba(255, 255, 255, 0.2) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PDF Auto-Paging */}
              <div className="mt-4">
                <Label className="text-white/70 text-sm">Auto-paging</Label>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pdfAutoPaging: !formData.pdfAutoPaging })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.pdfAutoPaging
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {formData.pdfAutoPaging ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  Automatically advance through pages during playback
                </p>
              </div>

              {/* PDF Pages Selection */}
              <div className="mt-4">
                <Label className="text-white/70 text-sm">Pages</Label>
                <Input
                  type="text"
                  value={formData.pdfPages}
                  onChange={(e) => setFormData({ ...formData, pdfPages: e.target.value })}
                  placeholder="e.g., 1,3-5 (leave blank for all)"
                  className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                />
                <p className="text-white/50 text-xs mt-1">
                  Select specific pages or ranges to display
                </p>
              </div>

              {/* Seconds per page */}
              <div className="mt-4">
                <Label className="text-white/70 text-sm">Seconds per page</Label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={formData.pdfPageDuration}
                  onChange={(e) => setFormData({ ...formData, pdfPageDuration: parseInt(e.target.value) || 10 })}
                  className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                />
                <p className="text-white/50 text-xs mt-1">
                  Time to display each page when auto-paging is enabled
                </p>
              </div>
            </>
          )}

          {/* YouTube URL (for YouTube content) */}
          {content.type.toUpperCase() === ContentType.YOUTUBE && (
            <div>
              <Label htmlFor="url" className="text-white/70 text-sm">
                YouTube URL
              </Label>
              <Input
                id="url"
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-white/50 text-xs mt-1">
                Update the YouTube video URL or ID
              </p>
            </div>
          )}

          {/* Text Content Settings */}
          {content.type.toUpperCase() === ContentType.TEXT && (
            <>
              {/* Text Content */}
              <div>
                <Label htmlFor="textContent" className="text-white/70 text-sm">
                  Text Content
                </Label>
                <Textarea
                  id="textContent"
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                  placeholder="Enter the text to display"
                  rows={5}
                />
              </div>

              {/* Font Size */}
              <div>
                <Label htmlFor="fontSize" className="text-white/70 text-sm">
                  Font Size
                </Label>
                <Input
                  id="fontSize"
                  type="text"
                  value={formData.fontSize}
                  onChange={(e) => setFormData({ ...formData, fontSize: e.target.value })}
                  className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                  placeholder="3rem"
                />
                <p className="text-white/50 text-xs mt-1">
                  Use CSS units like rem, em, px, or %
                </p>
              </div>

              {/* Font Color */}
              <div>
                <Label className="text-white/70 text-sm">Font Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={formData.fontColor}
                    onChange={(e) => setFormData({ ...formData, fontColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer border-2 border-white/10"
                  />
                  <Input
                    type="text"
                    value={formData.fontColor}
                    onChange={(e) => setFormData({ ...formData, fontColor: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <Label className="text-white/70 text-sm">Text Alignment</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, textAlign: 'left' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.textAlign === 'left'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, textAlign: 'center' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.textAlign === 'center'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, textAlign: 'right' })}
                    className={`px-3 py-2 rounded-lg border transition ${
                      formData.textAlign === 'right'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-white hover:bg-white/10 backdrop-blur-sm"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-orange-500/90 backdrop-blur-sm hover:bg-brand-orange-600/90 text-white"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
