'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { 
  Monitor, 
  Users, 
  Image, 
  PlayCircle, 
  Activity, 
  AlertTriangle,
  BarChart3,
  Clock,
  Server,
  TrendingUp,
  Shield,
  FileText
} from 'lucide-react';

// Dashboard component imports
import DisplayStatusOverview from '@/components/admin/DisplayStatusOverview';
import ContentUsageAnalytics from '@/components/admin/ContentUsageAnalytics';
import PlaylistMetrics from '@/components/admin/PlaylistMetrics';
import SystemHealth from '@/components/admin/SystemHealth';
import RealtimeAlerts from '@/components/admin/RealtimeAlerts';
import HistoricalCharts from '@/components/admin/HistoricalCharts';

interface DashboardStats {
  totalDisplays: number;
  onlineDisplays: number;
  totalContent: number;
  totalPlaylists: number;
  totalUsers: number;
  systemUptime: string;
  lastWeekDisplayViews: number;
  contentStorageUsed: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user && !user.permissions?.includes('USER_CONTROL')) {
      router.push('/unauthorized');
      return;
    }
    fetchDashboardStats();
  }, [user, authLoading, isAuthenticated, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <BarChart3 className="inline-block mr-3 text-brand-orange-500" size={40} />
                Admin Dashboard
              </h1>
              <p className="text-white/70">System analytics and management overview</p>
            </div>
            <div className="flex gap-4">
              <Link 
                href="/admin/users"
                className="px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold rounded-lg transition duration-200"
              >
                <Users className="inline-block mr-2" size={20} />
                Manage Users
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Displays"
            value={stats?.totalDisplays || 0}
            subtitle={`${stats?.onlineDisplays || 0} online`}
            icon={<Monitor className="text-brand-orange-500" size={24} />}
            trend={stats?.onlineDisplays && stats?.totalDisplays ? 
              `${Math.round((stats.onlineDisplays / stats.totalDisplays) * 100)}% online` : 
              'No data'
            }
          />
          <StatCard
            title="Content Files"
            value={stats?.totalContent || 0}
            subtitle={stats?.contentStorageUsed || 'N/A'}
            icon={<Image className="text-blue-400" size={24} />}
            trend="Storage usage"
          />
          <StatCard
            title="Playlists"
            value={stats?.totalPlaylists || 0}
            subtitle="Active configurations"
            icon={<PlayCircle className="text-green-400" size={24} />}
            trend="Total created"
          />
          <StatCard
            title="Users"
            value={stats?.totalUsers || 0}
            subtitle="System accounts"
            icon={<Users className="text-purple-400" size={24} />}
            trend="Active users"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Display Status Overview - Takes full width on larger screens */}
          <div className="xl:col-span-2">
            <DisplayStatusOverview />
          </div>

          {/* Real-time Alerts */}
          <div>
            <RealtimeAlerts />
          </div>

          {/* System Health */}
          <div>
            <SystemHealth />
          </div>

          {/* Content Usage Analytics */}
          <div>
            <ContentUsageAnalytics />
          </div>

          {/* Playlist Performance Metrics */}
          <div>
            <PlaylistMetrics />
          </div>

          {/* Historical Charts - Takes full width */}
          <div className="xl:col-span-3">
            <HistoricalCharts />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="View All Displays"
              description="Monitor display status and health"
              icon={<Monitor size={24} />}
              href="/displays"
            />
            <QuickActionCard
              title="Content Library"
              description="Manage media files and assets"
              icon={<Image size={24} />}
              href="/content"
            />
            <QuickActionCard
              title="System Logs"
              description="Review activity and error logs"
              icon={<FileText size={24} />}
              href="/admin/logs"
            />
            <QuickActionCard
              title="Settings"
              description="Configure system preferences"
              icon={<Shield size={24} />}
              href="/admin/settings"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend 
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/70 font-medium">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-white/60 text-sm mb-1">{subtitle}</div>
      <div className="text-brand-orange-500 text-xs font-medium">{trend}</div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  icon,
  href
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer group">
        <div className="flex items-center mb-3">
          <div className="text-brand-orange-500 group-hover:text-brand-orange-400 transition-colors">
            {icon}
          </div>
          <h3 className="text-white font-semibold ml-3">{title}</h3>
        </div>
        <p className="text-white/60 text-sm">{description}</p>
      </div>
    </Link>
  );
}