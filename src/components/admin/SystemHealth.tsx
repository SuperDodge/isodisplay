'use client';

import { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  HardDrive, 
  Users,
  Monitor,
  ListVideo,
  FileImage,
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';

interface ApplicationHealth {
  uptime: string;
  healthScore: number;
  database: {
    status: string;
    responseTime: number;
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
  };
  displays: {
    total: number;
    online: number;
    offline: number;
    percentage: number;
  };
  content: {
    total: number;
    storageUsed: string;
    recentUploads: number;
    processingQueue: {
      pending: number;
      processing: number;
      failed: number;
      completed24h: number;
    };
  };
  playlists: {
    total: number;
    active: number;
    utilizationRate: number;
  };
  users: {
    total: number;
    active: number;
    recentlyActive: number;
    activityRate: number;
  };
  api: {
    status: string;
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: string;
  };
  services: {
    name: string;
    status: string;
    uptime?: string;
    responseTime?: number;
    details?: string;
  }[];
}

export default function SystemHealth() {
  const [health, setHealth] = useState<ApplicationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemHealth();
    // Update system health every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/system-health');
      if (!response.ok) throw new Error('Failed to fetch system health');
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'error':
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPercentageColor = (percentage: number, inverse: boolean = false) => {
    if (inverse) {
      if (percentage <= 20) return 'bg-green-500';
      if (percentage <= 50) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/70">Loading application health...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 h-[600px] overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Server className="text-brand-orange-500 mr-3" size={24} />
          <h2 className="text-xl font-bold text-white">Application Health</h2>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-white/50" />
          <span className="text-xs text-white/50">Uptime: {health?.uptime || 'Unknown'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Overall Health Score */}
      <div className="mb-6 bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Overall Health Score</span>
          <span className={`text-2xl font-bold ${getHealthScoreColor(health?.healthScore || 0)}`}>
            {health?.healthScore || 0}%
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className={`${getHealthScoreBg(health?.healthScore || 0)} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${health?.healthScore || 0}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Displays Status */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Monitor size={14} className="text-blue-400 mr-2" />
              <span className="text-white text-sm">Displays</span>
            </div>
            <span className="text-xs text-white/70">
              {health?.displays.online}/{health?.displays.total}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className={`${getPercentageColor(health?.displays.percentage || 0)} h-1.5 rounded-full`}
              style={{ width: `${health?.displays.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Database size={14} className="text-indigo-400 mr-2" />
              <span className="text-white text-sm">Database</span>
            </div>
            {health?.database.status === 'healthy' ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              <XCircle size={14} className="text-red-400" />
            )}
          </div>
          <div className="text-xs text-white/60">
            {health?.database.responseTime}ms • Pool: {health?.database.connectionPool.active}/{health?.database.connectionPool.total}
          </div>
        </div>

        {/* Content Storage */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FileImage size={14} className="text-orange-400 mr-2" />
              <span className="text-white text-sm">Content</span>
            </div>
            <span className="text-xs text-white/70">
              {health?.content.total} files
            </span>
          </div>
          <div className="text-xs text-white/60">
            {health?.content.storageUsed} • {health?.content.recentUploads} new today
          </div>
        </div>

        {/* Playlists */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <ListVideo size={14} className="text-green-400 mr-2" />
              <span className="text-white text-sm">Playlists</span>
            </div>
            <span className="text-xs text-white/70">
              {health?.playlists.active}/{health?.playlists.total}
            </span>
          </div>
          <div className="text-xs text-white/60">
            {health?.playlists.utilizationRate}% utilization
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Users size={14} className="text-purple-400 mr-2" />
              <span className="text-white text-sm">Users</span>
            </div>
            <span className="text-xs text-white/70">
              {health?.users.active}/{health?.users.total}
            </span>
          </div>
          <div className="text-xs text-white/60">
            {health?.users.activityRate}% active (7d)
          </div>
        </div>

        {/* API Performance */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Activity size={14} className="text-cyan-400 mr-2" />
              <span className="text-white text-sm">API</span>
            </div>
            <TrendingUp size={14} className="text-green-400" />
          </div>
          <div className="text-xs text-white/60">
            {health?.api.avgResponseTime}ms • {health?.api.errorRate}% errors
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-white font-medium mb-3">Services Status</h3>
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {health?.services.length === 0 ? (
            <div className="text-white/50 text-sm text-center py-4">No services monitored</div>
          ) : (
            health?.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-white/5 rounded p-2">
                <div className="flex items-center">
                  {getStatusIcon(service.status)}
                  <span className="text-white ml-2">{service.name}</span>
                </div>
                <div className="text-white/60 text-xs">
                  {service.details || 
                   (service.responseTime && `${service.responseTime}ms`) ||
                   service.uptime}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/60">
        <span>Auto-refresh every 30 seconds</span>
        <button
          onClick={fetchSystemHealth}
          className="text-brand-orange-500 hover:text-brand-orange-400 transition-colors"
        >
          Refresh now
        </button>
      </div>
    </div>
  );
}