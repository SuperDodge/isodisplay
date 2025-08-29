'use client';

import { useState } from 'react';
import { X, Youtube, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCSRF } from '@/hooks/useCSRF';

interface YouTubeAddModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function YouTubeAddModal({ onClose, onSuccess }: YouTubeAddModalProps) {
  const { secureFetch } = useCSRF();
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
    duration: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    importing: boolean;
  }>({ current: 0, total: 0, importing: false });

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([^&\n?#]+)$/ // Just the ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Get YouTube thumbnail URL - use different quality options
  const getYouTubeThumbnail = (videoId: string, quality: 'max' | 'hq' | 'mq' | 'sd' = 'hq') => {
    const qualityMap = {
      max: 'maxresdefault',
      hq: 'hqdefault',  // 480x360 - usually from middle of video
      mq: 'mqdefault',  // 320x180 - usually from middle of video  
      sd: 'sddefault',  // 640x480 - usually from middle of video
    };
    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
  };

  // Get multiple thumbnail options (YouTube provides several frames)
  const getYouTubeThumbnails = (videoId: string) => {
    return {
      default: getYouTubeThumbnail(videoId, 'hq'), // Usually from middle of video
      max: getYouTubeThumbnail(videoId, 'max'),
      frame1: `https://img.youtube.com/vi/${videoId}/1.jpg`, // ~25% through video
      frame2: `https://img.youtube.com/vi/${videoId}/2.jpg`, // ~50% through video
      frame3: `https://img.youtube.com/vi/${videoId}/3.jpg`, // ~75% through video
    };
  };

  // Handle URL change and extract video info
  const handleUrlChange = async (url: string) => {
    setFormData({ ...formData, url });
    setError(null);
    
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      if (url.length > 0) {
        setError('Invalid YouTube URL');
      }
      setExtractedInfo(null);
      return;
    }

    // Get thumbnail options
    const thumbnails = getYouTubeThumbnails(videoId);
    
    // Extract basic info from YouTube
    setExtractedInfo({
      videoId,
      thumbnailUrl: thumbnails.frame2, // Use middle frame (50% through video)
      thumbnails,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    });

    // If name is empty, try to get video title
    if (!formData.name) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || `YouTube Video`,
      }));
    }
    
    // Note: Duration will be 0 which means "play full video"
    // YouTube API would be needed to get actual duration
  };

  const handleImportChannelVideos = async () => {
    setImportLoading(true);
    setError(null);
    setImportProgress({ current: 0, total: 0, importing: true });

    try {
      // First, get list of videos from the channel that haven't been imported
      const checkResponse = await secureFetch('/api/content/youtube/channel-import', {
        method: 'GET',
      });

      if (!checkResponse.ok) {
        const data = await checkResponse.json();
        throw new Error(data.error || 'Failed to fetch channel videos');
      }

      const { videos, existingCount } = await checkResponse.json();
      
      if (videos.length === 0) {
        setError(`All videos from the channel have already been imported. (${existingCount} videos in database)`);
        setImportLoading(false);
        setImportProgress({ current: 0, total: 0, importing: false });
        return;
      }

      setImportProgress({ current: 0, total: videos.length, importing: true });

      // Import videos in batches
      const batchSize = 5;
      let imported = 0;
      
      for (let i = 0; i < videos.length; i += batchSize) {
        const batch = videos.slice(i, i + batchSize);
        
        const batchResponse = await secureFetch('/api/content/youtube/channel-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videos: batch }),
        });

        if (!batchResponse.ok) {
          console.error('Failed to import batch', await batchResponse.json());
        } else {
          imported += batch.length;
          setImportProgress({ current: imported, total: videos.length, importing: true });
        }
      }

      setImportProgress({ current: 0, total: 0, importing: false });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import');
      setImportProgress({ current: 0, total: 0, importing: false });
    } finally {
      setImportLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const videoId = extractYouTubeId(formData.url);
    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await secureFetch('/api/content/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formData.url,
          videoId,
          name: formData.name || `YouTube Video`,
          description: formData.description,
          duration: formData.duration || 0, // 0 means play full video
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/2.jpg`, // Frame from middle of video
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add YouTube video');
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
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Youtube className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-white">Add YouTube Video</h2>
          </div>
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
            <div className="p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Import Channel Videos Button */}
          <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-white font-medium">Import Channel Videos</h3>
                <p className="text-white/50 text-sm mt-1">
                  Import all new videos from @isomerpg channel
                </p>
              </div>
              <Youtube className="w-8 h-8 text-red-500 opacity-50" />
            </div>
            
            {importProgress.importing && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Importing videos...</span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-brand-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            <Button
              type="button"
              onClick={handleImportChannelVideos}
              disabled={loading || importLoading}
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-sm transition-all"
            >
              {importLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {importProgress.importing 
                    ? `Importing ${importProgress.current}/${importProgress.total}...` 
                    : 'Checking channel...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import All New Videos
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/[0.02] backdrop-blur-xl px-2 text-white/50">or add single video</span>
            </div>
          </div>

          {/* YouTube URL */}
          <div>
            <Label htmlFor="url" className="text-white/70 text-sm">
              YouTube URL *
            </Label>
            <Input
              id="url"
              type="text"
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              required
              className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10 transition-all"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-white/50 text-xs mt-1">
              Enter a YouTube video URL or just the video ID
            </p>
          </div>

          {/* Preview Thumbnail */}
          {extractedInfo && (
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <p className="text-white/70 text-xs mb-2">Preview</p>
              <div className="aspect-video bg-black rounded overflow-hidden">
                <img
                  src={extractedInfo.thumbnailUrl}
                  alt="YouTube thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/placeholder/640/360';
                  }}
                />
              </div>
              <p className="text-white/50 text-xs mt-2">
                Video ID: {extractedInfo.videoId}
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-white/70 text-sm">
              Display Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10 transition-all"
              placeholder="Enter a name for this video"
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
              className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10 transition-all"
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration" className="text-white/70 text-sm">
              Playback Duration (optional)
            </Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10 transition-all"
              placeholder="0"
              min="0"
            />
            <p className="text-white/50 text-xs mt-1">
              Default: Full video playback (0 or empty)
            </p>
            <p className="text-white/50 text-xs">
              Set a value in seconds to limit playback duration (e.g., 30 for 30 seconds)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-white hover:bg-white/5 backdrop-blur-sm transition-all"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-orange-500/90 hover:bg-brand-orange-600 text-white backdrop-blur-sm transition-all shadow-lg hover:shadow-xl"
              disabled={loading || !extractYouTubeId(formData.url)}
            >
              {loading ? 'Adding...' : 'Add Video'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}