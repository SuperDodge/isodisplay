'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Monitor, Users, Activity, Calendar } from 'lucide-react';

interface ChartData {
  date: string;
  displayViews: number;
  contentUploads: number;
  playlistChanges: number;
  systemUptime: number;
}

interface HistoricalData {
  last7Days: ChartData[];
  last30Days: ChartData[];
  summary: {
    totalViews: number;
    avgDailyUploads: number;
    peakConcurrentDisplays: number;
    avgSystemUptime: number;
  };
}

export default function HistoricalCharts() {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    fetchHistoricalData();
  }, [timeRange]);

  const fetchHistoricalData = async () => {
    try {
      const response = await fetch(`/api/admin/dashboard/historical-data?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currentData = timeRange === '7d' ? data?.last7Days : data?.last30Days;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (timeRange === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getMaxValue = (data: ChartData[], key: keyof ChartData) => {
    if (!data?.length) return 100;
    return Math.max(...data.map(d => Number(d[key]))) || 100;
  };

  const renderBarChart = (data: ChartData[], dataKey: keyof ChartData, color: string, label: string) => {
    if (!data?.length) return null;
    
    const maxValue = getMaxValue(data, dataKey);
    
    return (
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 text-sm">{label}</h4>
        <div className="flex items-end justify-between gap-2 h-32">
          {data.map((item, index) => {
            const value = Number(item[dataKey]);
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full ${color} rounded-t transition-all duration-500 min-h-[2px]`}
                  style={{ height: `${height}%` }}
                  title={`${formatDate(item.date)}: ${value}`}
                />
                <div className="text-xs text-white/60 mt-2 transform rotate-45 origin-bottom-left">
                  {formatDate(item.date).split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-white/50 mt-2 text-center">
          Max: {Math.max(...data.map(d => Number(d[dataKey])))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/70">Loading historical data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="text-brand-orange-500 mr-3" size={24} />
          <h2 className="text-xl font-bold text-white">Historical Analytics</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === '7d'
                ? 'bg-brand-orange-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === '30d'
                ? 'bg-brand-orange-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <Monitor className="mx-auto text-blue-400 mb-2" size={20} />
          <div className="text-white font-semibold">{data?.summary.totalViews || 0}</div>
          <div className="text-white/60 text-xs">Total Views</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <TrendingUp className="mx-auto text-green-400 mb-2" size={20} />
          <div className="text-white font-semibold">{data?.summary.avgDailyUploads || 0}</div>
          <div className="text-white/60 text-xs">Avg Daily Uploads</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <Users className="mx-auto text-purple-400 mb-2" size={20} />
          <div className="text-white font-semibold">{data?.summary.peakConcurrentDisplays || 0}</div>
          <div className="text-white/60 text-xs">Peak Concurrent</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <Activity className="mx-auto text-orange-400 mb-2" size={20} />
          <div className="text-white font-semibold">{data?.summary.avgSystemUptime || 0}%</div>
          <div className="text-white/60 text-xs">Avg Uptime</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBarChart(
          currentData || [], 
          'displayViews', 
          'bg-brand-orange-500', 
          'Display Views'
        )}
        
        {renderBarChart(
          currentData || [], 
          'contentUploads', 
          'bg-green-500', 
          'Content Uploads'
        )}
        
        {renderBarChart(
          currentData || [], 
          'playlistChanges', 
          'bg-yellow-500', 
          'Playlist Changes'
        )}
        
        {renderBarChart(
          currentData || [], 
          'systemUptime', 
          'bg-orange-500', 
          'System Uptime %'
        )}
      </div>

      {currentData?.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="mx-auto text-white/30 mb-4" size={48} />
          <div className="text-white/60">No historical data available for this period</div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-xs text-white/60">
        <span>Data updated daily at midnight</span>
        <button
          onClick={fetchHistoricalData}
          className="text-brand-orange-500 hover:text-brand-orange-400 transition-colors"
        >
          Refresh data
        </button>
      </div>
    </div>
  );
}