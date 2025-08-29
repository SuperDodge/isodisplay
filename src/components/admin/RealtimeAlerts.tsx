'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Monitor, 
  Server,
  Database,
  Bell,
  CheckCircle,
  X
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'display' | 'system' | 'content' | 'network';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  displayName?: string;
}

export default function RealtimeAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 15 seconds
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/dashboard/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      ));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/dashboard/alerts/${alertId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to dismiss alert');
      
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const getAlertIcon = (type: string, category: string) => {
    if (type === 'error') {
      return <XCircle size={16} className="text-red-400" />;
    } else if (type === 'warning') {
      return <AlertTriangle size={16} className="text-yellow-400" />;
    } else {
      switch (category) {
        case 'display':
          return <Monitor size={16} className="text-blue-400" />;
        case 'system':
          return <Server size={16} className="text-purple-400" />;
        case 'network':
          return <Database size={16} className="text-green-400" />;
        default:
          return <Bell size={16} className="text-blue-400" />;
      }
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-500/30 bg-red-500/5';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
      default: return 'border-brand-orange-500/30 bg-brand-orange-500/5';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/70">Loading alerts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 h-[500px] overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="text-brand-orange-500 mr-3" size={24} />
          <h2 className="text-xl font-bold text-white">Real-time Alerts</h2>
        </div>
        <div className="flex items-center text-sm">
          {activeAlerts.length > 0 && (
            <div className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
              {activeAlerts.length} active
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
          <div className="text-white/60">No alerts - system healthy</div>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          {/* Active Alerts */}
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-4 transition-all duration-200 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  {getAlertIcon(alert.type, alert.category)}
                  <div className="ml-3">
                    <h3 className="text-white font-medium text-sm">{alert.title}</h3>
                    {alert.displayName && (
                      <div className="text-white/60 text-xs">Display: {alert.displayName}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-white/60 hover:text-white transition-colors p-1"
                    title="Acknowledge"
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-white/60 hover:text-red-400 transition-colors p-1"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-3">{alert.message}</p>
              <div className="flex items-center text-xs text-white/60">
                <Clock size={10} className="mr-1" />
                {formatTimestamp(alert.timestamp)}
                <span className="ml-3 capitalize bg-white/10 px-2 py-1 rounded">
                  {alert.category}
                </span>
              </div>
            </div>
          ))}

          {/* Acknowledged Alerts */}
          {acknowledgedAlerts.length > 0 && (
            <>
              {activeAlerts.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <h3 className="text-white/60 text-sm font-medium mb-2">Acknowledged</h3>
                </div>
              )}
              {acknowledgedAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-3 opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {getAlertIcon(alert.type, alert.category)}
                      <div className="ml-3">
                        <h3 className="text-white font-medium text-sm">{alert.title}</h3>
                        <p className="text-white/60 text-xs">{alert.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-white/40 hover:text-red-400 transition-colors p-1"
                      title="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex items-center text-xs text-white/40 mt-2">
                    <CheckCircle size={10} className="mr-1" />
                    Acknowledged • {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/60">
        <span>Auto-refresh every 15 seconds</span>
        <button
          onClick={fetchAlerts}
          className="text-brand-orange-500 hover:text-brand-orange-400 transition-colors"
        >
          Refresh alerts
        </button>
      </div>
    </div>
  );
}