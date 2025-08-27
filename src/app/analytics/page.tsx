'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, Users, Monitor, FileVideo, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AnalyticsData {
  activeDisplays: number;
  contentItems: number;
  totalViews: number;
  uptimePercentage: number;
  contentPerformance: Array<{ name: string; views: number }>;
  displayActivity: Array<{ name: string; views: number }>;
  recentViews: Array<{
    id: string;
    timestamp: string;
    displayName: string;
    contentName: string;
  }>;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    activeDisplays: 0,
    contentItems: 0,
    totalViews: 0,
    uptimePercentage: 0,
    contentPerformance: [],
    displayActivity: [],
    recentViews: []
  });
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/analytics/stats', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;
    
    // Only redirect if we're sure there's no user after auth check completes
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // If authenticated, load analytics data
    if (isAuthenticated) {
      fetchAnalytics();
      
      // Refresh data every 30 seconds
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading while auth is checking or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }
  
  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-white/70">Track performance and usage of your digital signage network</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Monitor className="w-8 h-8 text-brand-orange-500" />
                <span className="text-2xl font-bold text-white">{analyticsData.activeDisplays}</span>
              </div>
              <h3 className="text-white/70 text-sm">Active Displays</h3>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <FileVideo className="w-8 h-8 text-brand-orange-500" />
                <span className="text-2xl font-bold text-white">{analyticsData.contentItems}</span>
              </div>
              <h3 className="text-white/70 text-sm">Content Items</h3>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-brand-orange-500" />
                <span className="text-2xl font-bold text-white">{analyticsData.totalViews}</span>
              </div>
              <h3 className="text-white/70 text-sm">Total Views</h3>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-white">{analyticsData.uptimePercentage}%</span>
              </div>
              <h3 className="text-white/70 text-sm">Uptime</h3>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-white">Content Performance</h3>
              </div>
              <div className="h-64 overflow-y-auto custom-scrollbar">
                {analyticsData.contentPerformance.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.contentPerformance.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-white/80 truncate flex-1">{item.name}</span>
                        <span className="text-white font-semibold ml-2">{item.views} views</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30">
                    <p>No view data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-white">Display Activity</h3>
              </div>
              <div className="h-64 overflow-y-auto custom-scrollbar">
                {analyticsData.displayActivity.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.displayActivity.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-white/80 truncate flex-1">{item.name}</span>
                        <span className="text-white font-semibold ml-2">{item.views} views</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30">
                    <p>No display activity yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}