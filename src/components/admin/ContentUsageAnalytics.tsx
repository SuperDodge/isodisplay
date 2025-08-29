'use client';

import { useState, useEffect } from 'react';
import { Image, Video, FileText, Link, Youtube, Type, BarChart3, TrendingUp } from 'lucide-react';

interface ContentStats {
  totalFiles: number;
  totalSize: string;
  byType: {
    type: string;
    count: number;
    size: string;
    percentage: number;
  }[];
  recentUploads: {
    name: string;
    type: string;
    uploadedAt: string;
    size: string;
  }[];
  mostUsedContent: {
    name: string;
    type: string;
    usageCount: number;
  }[];
}

export default function ContentUsageAnalytics() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContentStats();
  }, []);

  const fetchContentStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/content-analytics');
      if (!response.ok) throw new Error('Failed to fetch content analytics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'IMAGE': return <Image size={16} className="text-blue-400" />;
      case 'VIDEO': return <Video size={16} className="text-purple-400" />;
      case 'PDF': return <FileText size={16} className="text-red-400" />;
      case 'URL': return <Link size={16} className="text-green-400" />;
      case 'YOUTUBE': return <Youtube size={16} className="text-red-500" />;
      case 'TEXT': return <Type size={16} className="text-yellow-400" />;
      default: return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 40) return 'bg-brand-orange-500';
    if (percentage > 20) return 'bg-green-500';
    if (percentage > 10) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/70">Loading content analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 h-[600px] overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex items-center mb-6">
        <BarChart3 className="text-brand-orange-500 mr-3" size={24} />
        <h2 className="text-xl font-bold text-white">Content Usage Analytics</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Content Type Breakdown */}
      <div className="mb-6">
        <h3 className="text-white font-medium mb-3">Content Types</h3>
        <div className="space-y-3">
          {stats?.byType.map((type) => (
            <div key={type.type} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getContentIcon(type.type)}
                  <span className="text-white ml-2 capitalize">{type.type.toLowerCase()}</span>
                </div>
                <div className="text-white/80 text-sm">
                  {type.count} files ({type.size})
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`${getProgressColor(type.percentage)} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${type.percentage}%` }}
                />
              </div>
              <div className="text-white/60 text-xs mt-1">{type.percentage.toFixed(1)}% of total</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="mb-6">
        <h3 className="text-white font-medium mb-3 flex items-center">
          <TrendingUp size={16} className="mr-2" />
          Recent Uploads
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
          {stats?.recentUploads.length === 0 ? (
            <div className="text-white/50 text-sm text-center py-4">No recent uploads</div>
          ) : (
            stats?.recentUploads.map((upload, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {getContentIcon(upload.type)}
                  <span className="text-white/80 ml-2 truncate max-w-24">{upload.name}</span>
                </div>
                <div className="text-white/60 text-xs">
                  {upload.size} • {formatDate(upload.uploadedAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Most Used Content */}
      <div>
        <h3 className="text-white font-medium mb-3">Most Used Content</h3>
        <div className="space-y-2">
          {stats?.mostUsedContent.length === 0 ? (
            <div className="text-white/50 text-sm text-center py-4">No usage data available</div>
          ) : (
            stats?.mostUsedContent.map((content, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {getContentIcon(content.type)}
                  <span className="text-white/80 ml-2 truncate max-w-32">{content.name}</span>
                </div>
                <div className="text-brand-orange-500 font-medium">
                  {content.usageCount} uses
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}