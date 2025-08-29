'use client';

import { useState, useEffect } from 'react';
import { Monitor, Wifi, WifiOff, Clock, MapPin, AlertTriangle } from 'lucide-react';

interface Display {
  id: string;
  name: string;
  urlSlug: string;
  isOnline: boolean;
  lastSeen: string | null;
  resolution: string;
  orientation: string;
  playlist?: {
    name: string;
  } | null;
}

interface DisplayStats {
  total: number;
  online: number;
  offline: number;
  displays: Display[];
}

export default function DisplayStatusOverview() {
  const [displayStats, setDisplayStats] = useState<DisplayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDisplayStats();
    // Set up polling for real-time updates
    const interval = setInterval(fetchDisplayStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDisplayStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/displays');
      if (!response.ok) throw new Error('Failed to fetch display stats');
      const data = await response.json();
      setDisplayStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getLastSeenText = (lastSeen: string | null) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (isOnline: boolean) => {
    if (isOnline) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
          <Wifi size={12} className="mr-1" />
          Online
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
          <WifiOff size={12} className="mr-1" />
          Offline
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/70">Loading display status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 h-[500px] overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Monitor className="text-brand-orange-500 mr-3" size={24} />
          <h2 className="text-xl font-bold text-white">Display Status Overview</h2>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-green-300">
            <Wifi size={16} className="inline mr-1" />
            {displayStats?.online || 0} Online
          </div>
          <div className="text-red-300">
            <WifiOff size={16} className="inline mr-1" />
            {displayStats?.offline || 0} Offline
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{displayStats?.total || 0}</div>
          <div className="text-white/60 text-sm">Total Displays</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{displayStats?.online || 0}</div>
          <div className="text-white/60 text-sm">Online</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{displayStats?.offline || 0}</div>
          <div className="text-white/60 text-sm">Offline</div>
        </div>
      </div>

      {/* Display List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {displayStats?.displays.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="mx-auto text-white/30 mb-4" size={48} />
            <div className="text-white/60">No displays configured</div>
          </div>
        ) : (
          displayStats?.displays.map((display) => (
            <div
              key={display.id}
              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Monitor size={16} className="text-white/70 mr-2" />
                  <h3 className="text-white font-medium">{display.name}</h3>
                </div>
                {getStatusBadge(display.isOnline)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/50">URL Slug</div>
                  <div className="text-white/80 font-mono text-xs">{display.urlSlug}</div>
                </div>
                <div>
                  <div className="text-white/50">Last Seen</div>
                  <div className="text-white/80 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {getLastSeenText(display.lastSeen)}
                  </div>
                </div>
                <div>
                  <div className="text-white/50">Resolution</div>
                  <div className="text-white/80">{display.resolution}</div>
                </div>
                <div>
                  <div className="text-white/50">Playlist</div>
                  <div className="text-white/80">
                    {display.playlist?.name || (
                      <span className="text-yellow-400 flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        No playlist
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {displayStats && displayStats.displays.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm text-white/60">
            <span>Auto-refresh every 30 seconds</span>
            <button
              onClick={fetchDisplayStats}
              className="text-brand-orange-500 hover:text-brand-orange-400 transition-colors"
            >
              Refresh now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}