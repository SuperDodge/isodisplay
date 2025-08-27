'use client';

import { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity
} from 'lucide-react';

interface SystemMetrics {
  uptime: string;
  cpuUsage: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: string;
    total: string;
    percentage: number;
  };
  databaseStatus: {
    connected: boolean;
    responseTime: number;
    poolSize: number;
  };
  networkStatus: {
    connected: boolean;
    latency: number;
  };
  services: {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    responseTime?: number;
  }[];
}

export default function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
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
      setMetrics(data);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/70">Loading system health...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
      <div className="flex items-center mb-6">
        <Server className="text-brand-orange-500 mr-3" size={24} />
        <h2 className="text-xl font-bold text-white">System Health</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* System Uptime */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity size={16} className="text-green-400 mr-2" />
            <span className="text-white font-medium">System Uptime</span>
          </div>
          <span className="text-green-400 font-semibold">{metrics?.uptime || 'Unknown'}</span>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="space-y-4 mb-6">
        {/* CPU Usage */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Cpu size={16} className="text-blue-400 mr-2" />
              <span className="text-white text-sm">CPU Usage</span>
            </div>
            <span className="text-white font-medium">{metrics?.cpuUsage || 0}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`${getUsageColor(metrics?.cpuUsage || 0)} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${metrics?.cpuUsage || 0}%` }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MemoryStick size={16} className="text-purple-400 mr-2" />
              <span className="text-white text-sm">Memory Usage</span>
            </div>
            <span className="text-white font-medium">
              {metrics?.memoryUsage ? `${metrics.memoryUsage.used}GB / ${metrics.memoryUsage.total}GB` : 'N/A'}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`${getUsageColor(metrics?.memoryUsage?.percentage || 0)} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${metrics?.memoryUsage?.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Disk Usage */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <HardDrive size={16} className="text-orange-400 mr-2" />
              <span className="text-white text-sm">Disk Usage</span>
            </div>
            <span className="text-white font-medium">
              {metrics?.diskUsage ? `${metrics.diskUsage.used} / ${metrics.diskUsage.total}` : 'N/A'}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`${getUsageColor(metrics?.diskUsage?.percentage || 0)} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${metrics?.diskUsage?.percentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Database & Network Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Database size={14} className="text-indigo-400 mr-2" />
              <span className="text-white text-sm">Database</span>
            </div>
            {metrics?.databaseStatus.connected ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              <XCircle size={14} className="text-red-400" />
            )}
          </div>
          <div className="text-xs text-white/60">
            {metrics?.databaseStatus.responseTime}ms • Pool: {metrics?.databaseStatus.poolSize}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Wifi size={14} className="text-cyan-400 mr-2" />
              <span className="text-white text-sm">Network</span>
            </div>
            {metrics?.networkStatus.connected ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              <XCircle size={14} className="text-red-400" />
            )}
          </div>
          <div className="text-xs text-white/60">
            Latency: {metrics?.networkStatus.latency}ms
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h3 className="text-white font-medium mb-3">Services Status</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
          {metrics?.services.length === 0 ? (
            <div className="text-white/50 text-sm text-center py-4">No services monitored</div>
          ) : (
            metrics?.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {getStatusIcon(service.status)}
                  <span className="text-white ml-2">{service.name}</span>
                </div>
                <div className="text-white/60 text-xs">
                  {service.uptime}
                  {service.responseTime && ` • ${service.responseTime}ms`}
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