'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, Clock, Monitor, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface PlaylistMetric {
  id: string;
  name: string;
  itemCount: number;
  totalDuration: string;
  displayCount: number;
  isActive: boolean;
  lastUsed: string | null;
  creator: string;
}

interface PlaylistStats {
  totalPlaylists: number;
  activePlaylists: number;
  totalPlaytime: string;
  avgItemsPerPlaylist: number;
  playlists: PlaylistMetric[];
}

export default function PlaylistMetrics() {
  const [stats, setStats] = useState<PlaylistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylistStats();
  }, []);

  const fetchPlaylistStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/playlist-metrics');
      if (!response.ok) throw new Error('Failed to fetch playlist metrics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isActive: boolean, displayCount: number) => {
    if (!isActive) {
      return <AlertTriangle size={14} className="text-yellow-400" />;
    } else if (displayCount === 0) {
      return <AlertTriangle size={14} className="text-orange-400" />;
    } else {
      return <CheckCircle size={14} className="text-green-400" />;
    }
  };

  const getStatusText = (isActive: boolean, displayCount: number) => {
    if (!isActive) return 'Inactive';
    if (displayCount === 0) return 'Not assigned';
    return 'Active';
  };

  const getStatusColor = (isActive: boolean, displayCount: number) => {
    if (!isActive) return 'text-yellow-400';
    if (displayCount === 0) return 'text-orange-400';
    return 'text-green-400';
  };

  const formatLastUsed = (lastUsed: string | null) => {
    if (!lastUsed) return 'Never';
    const date = new Date(lastUsed);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/70">Loading playlist metrics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 h-[600px] overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex items-center mb-6">
        <PlayCircle className="text-brand-orange-500 mr-3" size={24} />
        <h2 className="text-xl font-bold text-white">Playlist Performance</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats?.totalPlaylists || 0}</div>
          <div className="text-white/60 text-sm">Total Playlists</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats?.activePlaylists || 0}</div>
          <div className="text-white/60 text-sm">Active</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <Clock size={16} className="mx-auto text-blue-400 mb-2" />
          <div className="text-white font-medium">{stats?.totalPlaytime || '0h 0m'}</div>
          <div className="text-white/60 text-xs">Total Playtime</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <TrendingUp size={16} className="mx-auto text-purple-400 mb-2" />
          <div className="text-white font-medium">{stats?.avgItemsPerPlaylist || 0}</div>
          <div className="text-white/60 text-xs">Avg Items/Playlist</div>
        </div>
      </div>

      {/* Playlist List */}
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {stats?.playlists.length === 0 ? (
          <div className="text-center py-8">
            <PlayCircle className="mx-auto text-white/30 mb-4" size={48} />
            <div className="text-white/60">No playlists created</div>
          </div>
        ) : (
          stats?.playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <PlayCircle size={16} className="text-white/70 mr-2" />
                  <h3 className="text-white font-medium truncate max-w-32">{playlist.name}</h3>
                </div>
                <div className={`flex items-center text-xs ${getStatusColor(playlist.isActive, playlist.displayCount)}`}>
                  {getStatusIcon(playlist.isActive, playlist.displayCount)}
                  <span className="ml-1">{getStatusText(playlist.isActive, playlist.displayCount)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-white/50">Items</div>
                  <div className="text-white/80">{playlist.itemCount} files</div>
                </div>
                <div>
                  <div className="text-white/50">Duration</div>
                  <div className="text-white/80">{playlist.totalDuration}</div>
                </div>
                <div>
                  <div className="text-white/50">Displays</div>
                  <div className="text-white/80 flex items-center">
                    <Monitor size={10} className="mr-1" />
                    {playlist.displayCount}
                  </div>
                </div>
                <div>
                  <div className="text-white/50">Last Used</div>
                  <div className="text-white/80">{formatLastUsed(playlist.lastUsed)}</div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-xs text-white/50">
                  Created by: <span className="text-white/70">{playlist.creator}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {stats && stats.playlists.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={fetchPlaylistStats}
            className="text-brand-orange-500 hover:text-brand-orange-400 transition-colors text-sm"
          >
            Refresh metrics
          </button>
        </div>
      )}
    </div>
  );
}