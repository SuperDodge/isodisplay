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
  FileText,
  Database,
  Trash2,
  Download,
  CheckCircle,
  Loader2,
  Copy,
  Cog
} from 'lucide-react';

// Dashboard component imports
import DisplayStatusOverview from '@/components/admin/DisplayStatusOverview';
import ContentUsageAnalytics from '@/components/admin/ContentUsageAnalytics';
import PlaylistMetrics from '@/components/admin/PlaylistMetrics';
import SystemHealth from '@/components/admin/SystemHealth';
import RealtimeAlerts from '@/components/admin/RealtimeAlerts';
import HistoricalCharts from '@/components/admin/HistoricalCharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [operationLoading, setOperationLoading] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [logs, setLogs] = useState<{type: string, content: string}[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const showToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleBackupDatabase = async () => {
    setShowBackupDialog(false);
    setOperationLoading(true);
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Backup failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      a.download = `isodisplay-backup-${timestamp}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('success', 'Database backup downloaded successfully');
    } catch (error) {
      console.error('Backup error:', error);
      showToast('error', 'Failed to create database backup');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleClearCache = async () => {
    setShowClearCacheDialog(false);
    setOperationLoading(true);

    try {
      const response = await fetch('/api/admin/cache', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Cache clear failed');
      }

      const data = await response.json();
      showToast('success', data.message || 'Cache cleared successfully');
    } catch (error) {
      console.error('Cache clear error:', error);
      showToast('error', 'Failed to clear cache');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleViewLogs = async () => {
    setLogsLoading(true);
    setLogs([]);
    setShowLogsDialog(true);

    try {
      const response = await fetch('/api/admin/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Fetch logs error:', error);
      showToast('error', 'Failed to fetch log files');
      setShowLogsDialog(false);
    } finally {
      setLogsLoading(false);
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
            <div className="flex items-center gap-3">
              <Cog className="w-12 h-12 text-brand-orange-500" />
              <div>
                <h1 className="text-4xl font-bold text-white uppercase tracking-wide font-['Made_Tommy']">
                  Admin Dashboard
                </h1>
                <p className="text-white/70">System analytics and management overview</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link 
                href="/users"
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

        {/* Database Operations Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">System Administration</h2>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Database className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h3 className="text-xl font-semibold text-white">Database Operations</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">Backup Database</h4>
                    <p className="text-white/50 text-sm">Download a complete backup of the database</p>
                  </div>
                  <Button 
                    onClick={() => setShowBackupDialog(true)}
                    disabled={operationLoading}
                    variant="ghost" 
                    className="text-white hover:bg-white/10"
                  >
                    {operationLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Create Backup
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">Clear Cache</h4>
                    <p className="text-white/50 text-sm">Clear all cached data and thumbnails</p>
                  </div>
                  <Button 
                    onClick={() => setShowClearCacheDialog(true)}
                    disabled={operationLoading}
                    variant="ghost" 
                    className="text-white hover:bg-white/10"
                  >
                    {operationLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Clear Cache
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Logs Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mt-6">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <FileText className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h3 className="text-xl font-semibold text-white">System Logs</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">View Log Files</h4>
                    <p className="text-white/50 text-sm">Access system, error, and application logs</p>
                  </div>
                  <Button 
                    onClick={handleViewLogs}
                    disabled={operationLoading}
                    variant="ghost" 
                    className="text-white hover:bg-white/10"
                  >
                    {operationLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Open Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Clear Cache Confirmation Dialog */}
      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent className="bg-red-500/20 backdrop-blur-md border-red-500/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white text-lg">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <span style={{ 
                fontFamily: 'Made Tommy, sans-serif', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '0.01em' 
              }}>
                Clear Cache
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-300 pt-2 font-body">
              Are you sure you want to clear all cached data? This will remove all temporary files and thumbnails. 
              They will be regenerated as needed, which may temporarily affect performance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="text-white hover:bg-white/10 hover:text-white font-body"
              disabled={operationLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearCache}
              disabled={operationLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-body"
            >
              Clear Cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup Confirmation Dialog */}
      <AlertDialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <AlertDialogContent className="bg-blue-500/20 backdrop-blur-md border-blue-500/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white text-lg">
              <Database className="w-6 h-6 text-blue-400" />
              <span style={{ 
                fontFamily: 'Made Tommy, sans-serif', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '0.01em' 
              }}>
                Create Backup
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-blue-200 pt-2 font-body">
              This will create a complete backup of your database and download it to your device. 
              The backup can be used to restore your data if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="text-white hover:bg-white/10 hover:text-white font-body"
              disabled={operationLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBackupDatabase}
              disabled={operationLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-body"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logs Viewer Dialog */}
      <AlertDialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <AlertDialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white text-lg">
              <FileText className="w-6 h-6 text-brand-orange-500" />
              <span style={{ 
                fontFamily: 'Made Tommy, sans-serif', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '0.01em' 
              }}>
                System Logs
              </span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange-500" />
              </div>
            ) : logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-orange-500" />
                      {log.type}
                    </h4>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(log.content);
                        showToast('success', `${log.type} copied to clipboard`);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="bg-black/50 rounded p-3 text-xs text-gray-300 overflow-x-auto custom-scrollbar">
                    {log.content || 'No content available'}
                  </pre>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No log files available
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="text-white hover:bg-white/10 hover:text-white font-body"
              disabled={logsLoading}
            >
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-green-500/90 backdrop-blur-md text-white rounded-lg shadow-lg animate-in fade-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-red-500/90 backdrop-blur-md text-white rounded-lg shadow-lg animate-in fade-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        </div>
      )}
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

