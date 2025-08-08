
import React, { useState, useEffect } from "react";
import { ContentItem } from "@/api/entities";
import { Playlist } from "@/api/entities";
import { Display } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Monitor, 
  PlayCircle, 
  FolderOpen, 
  Upload, 
  Activity,
  Clock,
  Image,
  Video,
  Globe,
  FileText,
  Users, // Make sure Users icon is imported for the new button
  TrendingUp,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalContent: 0,
    totalPlaylists: 0,
    totalDisplays: 0,
    activeDisplays: 0,
    recentContent: [],
    displays: [],
    playlistStats: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [contentItems, playlists, displays] = await Promise.all([
        ContentItem.list('-created_date', 10),
        Playlist.list('-created_date'),
        Display.list('-created_date')
      ]);

      const activeDisplays = displays.filter(d => d.is_active);
      
      // Calculate playlist usage statistics
      const playlistStats = playlists.map(playlist => {
        const displaysUsingPlaylist = displays.filter(d => d.active_playlist_id === playlist.id);
        return {
          ...playlist,
          displayCount: displaysUsingPlaylist.length,
          displays: displaysUsingPlaylist
        };
      });
      
      setStats({
        totalContent: contentItems.length,
        totalPlaylists: playlists.length,
        totalDisplays: displays.length,
        activeDisplays: activeDisplays.length,
        recentContent: contentItems.slice(0, 5),
        displays: displays,
        playlistStats: playlistStats.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setIsLoading(false);
  };

  const handleInviteUser = async () => {
    // In a real application, you would send an API request here
    console.log("Inviting user with email:", inviteEmail);
    // Simulate an API call or success message
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    alert(`Invite sent to ${inviteEmail}! (Simulated)`); 
    setInviteEmail(''); // Clear input
    setIsInviteDialogOpen(false); // Close dialog
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'webpage': return Globe;
      case 'youtube': return PlayCircle;
      case 'text': return FileText;
      case 'pdf': return FileText;
      default: return FolderOpen;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      image: 'bg-green-500/20 text-green-400',
      video: 'bg-purple-500/20 text-purple-400',
      webpage: 'bg-blue-500/20 text-blue-400',
      youtube: 'bg-red-500/20 text-red-400',
      text: 'bg-yellow-500/20 text-yellow-400',
      pdf: 'bg-orange-500/20 text-orange-400'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  const getDisplayStatus = (display) => {
    // In a real system, you'd check last_ping time
    return display.is_active ? 'online' : 'offline';
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-transparent min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-white/10 rounded w-48 animate-pulse backdrop-blur-sm"></div>
            <div className="h-4 bg-white/10 rounded w-64 mt-2 animate-pulse backdrop-blur-sm"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-effect animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-white/10 rounded w-20 mb-2"></div>
                <div className="h-8 bg-white/10 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 relative">
      <div className="hexagon-pattern absolute inset-0 opacity-10"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Network Overview
            </h1>
            <p className="text-gray-300 text-lg">
              Monitor your digital signage network and content performance
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Displays")}>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-lg transition-all duration-300">
                <Monitor className="w-4 h-4 mr-2" />
                Manage Displays
              </Button>
            </Link>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300">
                  <Users className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass-effect border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Invite New User</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Enter the email address of the user you'd like to invite to your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="col-span-3 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleInviteUser}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!inviteEmail || !inviteEmail.includes('@') || !inviteEmail.includes('.')} // Basic email validation
                  >
                    Send Invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect hover:border-orange-500/30 transition-all duration-500 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Active Displays</p>
                  <p className="text-3xl font-bold font-mono text-white">{stats.activeDisplays}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {stats.activeDisplays > 0 ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-sm text-green-400 font-medium">Broadcasting</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400 mr-1" />
                    <span className="text-sm text-red-400 font-medium">No active displays</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:border-purple-500/30 transition-all duration-500 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Total Content</p>
                  <p className="text-3xl font-bold font-mono text-white">{stats.totalContent}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="w-4 h-4 text-blue-400 mr-1" />
                <span className="text-sm text-gray-300">Ready for display</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:border-blue-500/30 transition-all duration-500 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Playlists</p>
                  <p className="text-3xl font-bold font-mono text-white">{stats.totalPlaylists}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Activity className="w-4 h-4 text-orange-400 mr-1" />
                <span className="text-sm text-gray-300">Scheduled content</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:border-yellow-500/30 transition-all duration-500 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Network Health</p>
                  <p className="text-lg font-bold text-white">
                    {stats.totalDisplays > 0 ? Math.round((stats.activeDisplays / stats.totalDisplays) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <Progress 
                  value={stats.totalDisplays > 0 ? (stats.activeDisplays / stats.totalDisplays) * 100 : 0} 
                  className="h-2" 
                />
                <span className="text-sm text-gray-300 mt-2 block">
                  {stats.activeDisplays} of {stats.totalDisplays} displays online
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Bar */}
        <Card className="glass-effect mb-8">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-around gap-4">
            <h3 className="text-lg font-semibold text-white mr-4 hidden lg:block">Quick Actions:</h3>
            <Link to={createPageUrl("Upload")} className="flex-1 w-full md:w-auto">
              <Button className="w-full justify-center bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300" variant="outline">
                <Upload className="w-4 h-4 mr-3" />
                Upload New Content
              </Button>
            </Link>
            <Link to={createPageUrl("Playlists")} className="flex-1 w-full md:w-auto">
              <Button className="w-full justify-center bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300" variant="outline">
                <PlayCircle className="w-4 h-4 mr-3" />
                Create Playlist
              </Button>
            </Link>
            <Link to={createPageUrl("Displays")} className="flex-1 w-full md:w-auto">
              <Button className="w-full justify-center bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 transition-all duration-300" variant="outline">
                <Monitor className="w-4 h-4 mr-3" />
                Add Display
              </Button>
            </Link>
            <Link to={createPageUrl("ContentLibrary")} className="flex-1 w-full md:w-auto">
              <Button className="w-full justify-center bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300" variant="outline">
                <FolderOpen className="w-4 h-4 mr-3" />
                Manage Library
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Display Status */}
          <div className="lg:col-span-2">
            <Card className="glass-effect">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-orange-500" />
                  Display Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.displays.map((display) => {
                    const status = getDisplayStatus(display);
                    const activePlaylist = stats.playlistStats.find(p => p.id === display.active_playlist_id);
                    
                    return (
                      <div key={display.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20">
                        <div className="w-12 h-12 bg-slate-800/70 rounded-lg border border-white/10 flex items-center justify-center">
                          <Monitor className="w-6 h-6 text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{display.name}</h3>
                            <Badge className={status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {status === 'online' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Online
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Offline
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            {display.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {display.location}
                              </span>
                            )}
                            {activePlaylist && (
                              <span className="flex items-center gap-1">
                                <PlayCircle className="w-3 h-3" />
                                {activePlaylist.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`${createPageUrl("Display")}?display=${display.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                              Open Display
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  {stats.displays.length === 0 && (
                    <div className="text-center py-12">
                      <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-300 text-lg">No displays configured</p>
                      <p className="text-gray-500 mb-6">Add your first display to start broadcasting</p>
                      <Link to={createPageUrl("Displays")}>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none">
                          <Monitor className="w-4 h-4 mr-2" />
                          Add Display
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Playlist Usage */}
          <div className="space-y-6">
            <Card className="glass-effect">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-orange-500" />
                  Playlist Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.playlistStats.map((playlist) => (
                    <div key={playlist.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <p className="font-medium text-white">{playlist.name}</p>
                        <p className="text-sm text-gray-400">{playlist.content_items?.length || 0} items</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {playlist.displayCount} displays
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {stats.playlistStats.length === 0 && (
                    <div className="text-center py-6">
                      <PlayCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400">No playlists created</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
