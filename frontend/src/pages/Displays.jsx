
import React, { useState, useEffect } from "react";
import { Display } from "@/api/entities";
import { Playlist } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tv,
  Plus,
  Edit,
  Trash2,
  Radio,
  MapPin,
  Clock,
  Play,
  Pause,
  Settings,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Added Switch import
import { createPageUrl } from "@/utils";

export default function Displays() {
  const [displays, setDisplays] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    background_color: '#000000',
    show_clock: false,
    clock_position: 'top-right',
    refresh_interval: 300
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [displaysData, playlistsData] = await Promise.all([
        Display.list('-created_date'),
        Playlist.list('-created_date')
      ]);
      setDisplays(displaysData);
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleCreateDisplay = () => {
    setFormData({
      name: '',
      location: '',
      description: '',
      background_color: '#000000',
      show_clock: false,
      clock_position: 'top-right',
      refresh_interval: 300
    });
    setEditingDisplay(null);
    setShowCreateDialog(true);
  };

  const handleEditDisplay = (display) => {
    setFormData({
      name: display.name,
      location: display.location || '',
      description: display.description || '',
      background_color: display.background_color || '#000000',
      show_clock: display.show_clock || false,
      clock_position: display.clock_position || 'top-right',
      refresh_interval: display.refresh_interval || 300
    });
    setEditingDisplay(display);
    setShowCreateDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDisplay) {
        await Display.update(editingDisplay.id, formData);
      } else {
        await Display.create({ ...formData, is_active: true });
      }
      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving display:', error);
    }
  };

  const deleteDisplay = async (id) => {
    if (window.confirm('Are you sure you want to delete this display?')) {
      try {
        await Display.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting display:', error);
      }
    }
  };

  const setActivePlaylist = async (displayId, playlistId) => {
    try {
      await Display.update(displayId, {
        active_playlist_id: playlistId
      });
      loadData();
    } catch (error) {
      console.error('Error setting active playlist:', error);
    }
  };

  const toggleDisplayActive = async (display) => {
    try {
      await Display.update(display.id, {
        is_active: !display.is_active
      });
      loadData();
    } catch (error) {
      console.error('Error toggling display:', error);
    }
  };

  const getDisplayUrl = (displayId) => {
    return `${window.location.origin}${createPageUrl("Display")}?display=${displayId}`;
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-200 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Display Management</h1>
            <p className="text-gray-300">Control and monitor your digital signage displays</p>
          </div>
          <Button
            onClick={handleCreateDisplay}
            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Display
          </Button>
        </div>

        {/* Displays Grid */}
        {displays.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-800/70 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Tv className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No displays yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Add your first display to start managing your digital signage network
            </p>
            <Button
              onClick={handleCreateDisplay}
              className="bg-orange-500 hover:bg-orange-600 text-white border-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Display
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {displays.map((display) => {
              const activePlaylist = playlists.find(p => p.id === display.active_playlist_id);
              return (
                <Card 
                  key={display.id} 
                  className="glass-effect hover:border-white/20 transition-all duration-300 cursor-pointer"
                  onClick={() => handleEditDisplay(display)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Tv className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-white">
                            {display.name}
                          </CardTitle>
                          {display.location && (
                            <p className="flex items-center gap-1 text-gray-400 text-sm">
                              <MapPin className="w-3 h-3" />
                              {display.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          className={display.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                          }
                        >
                          {display.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    {display.description && (
                      <p className="text-gray-300 text-sm mt-2">{display.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current Playlist */}
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Radio className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-medium text-gray-200">Current Playlist</span>
                        </div>
                        {activePlaylist ? (
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">{activePlaylist.name}</span>
                            <Badge className="bg-green-500/20 text-green-400">
                              <Play className="w-3 h-3 mr-1" />
                              Playing
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No active playlist</p>
                        )}
                      </div>

                      {/* Playlist Selection */}
                      <div>
                        <Label className="text-sm font-medium text-gray-200">Change Playlist</Label>
                        <Select
                          value={display.active_playlist_id || ""}
                          onValueChange={(value) => setActivePlaylist(display.id, value)}
                        >
                          <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white focus:border-orange-500">
                            <SelectValue placeholder="Select playlist" />
                          </SelectTrigger>
                          <SelectContent className="glass-effect text-white border-white/20">
                            <SelectItem value={null} className="hover:bg-white/10">No playlist</SelectItem>
                            {playlists.map((playlist) => (
                              <SelectItem key={playlist.id} value={playlist.id} className="hover:bg-white/10">
                                {playlist.name} ({playlist.content_items?.length || 0} items)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Display URL */}
                      <div>
                        <Label className="text-sm font-medium text-gray-200">Display URL</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={getDisplayUrl(display.id)}
                            readOnly
                            className="text-xs bg-black/30 border-white/10 text-gray-300"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); window.open(getDisplayUrl(display.id), '_blank'); }}
                            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">
                            Refresh: {display.refresh_interval}s
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${display.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                          <span className="text-gray-300">
                            {display.is_active ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDisplayActive(display);
                          }}
                          className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                        >
                          {display.is_active ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDisplay(display.id);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 border-red-400/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>
                {editingDisplay ? 'Edit Display' : 'Add New Display'}
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Configure a new digital signage display for your network
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Display Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Lobby Display"
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Main Lobby, Building A"
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this display"
                  className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10 rounded border-white/20 cursor-pointer"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="refresh_interval">Refresh Interval (seconds)</Label>
                  <Input
                    id="refresh_interval"
                    type="number"
                    min="60"
                    max="3600"
                    value={formData.refresh_interval}
                    onChange={(e) => setFormData(prev => ({ ...prev, refresh_interval: parseInt(e.target.value) || 300 }))}
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Clock Overlay Settings */}
              <div className="space-y-4 p-6 glass-effect rounded-2xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <h4 className="font-bold text-blue-400 text-lg">Clock Overlay</h4>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show_clock" className="text-base text-gray-200">Show Clock</Label>
                    <p className="text-sm text-gray-400">Display current time on screen</p>
                  </div>
                  <Switch
                    id="show_clock"
                    checked={formData.show_clock}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_clock: checked }))}
                  />
                </div>
                
                {formData.show_clock && (
                  <div>
                    <Label htmlFor="clock_position" className="text-gray-200">Clock Position</Label>
                    <Select
                      value={formData.clock_position}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, clock_position: value }))}
                    >
                      <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-effect text-white border-white/20">
                        <SelectItem value="top-left" className="hover:bg-white/10">Top Left</SelectItem>
                        <SelectItem value="top-right" className="hover:bg-white/10">Top Right</SelectItem>
                        <SelectItem value="bottom-left" className="hover:bg-white/10">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right" className="hover:bg-white/10">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.name}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {editingDisplay ? 'Update Display' : 'Create Display'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
