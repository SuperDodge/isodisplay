
import React, { useState, useEffect } from "react";
import { Playlist } from "@/api/entities";
import { ContentItem } from "@/api/entities";
import { DisplaySettings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle,
  Plus,
  Edit,
  Trash2,
  Radio,
  GripVertical,
  Clock,
  Image,
  Video,
  Globe,
  Youtube,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content_items: [],
    transition_effect: 'fade'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playlistsData, contentData] = await Promise.all([
        Playlist.list('-created_date'),
        ContentItem.filter({ is_active: true })
      ]);
      setPlaylists(playlistsData);
      setContentItems(contentData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleCreatePlaylist = () => {
    setFormData({
      name: '',
      description: '',
      content_items: [],
      transition_effect: 'fade'
    });
    setEditingPlaylist(null);
    setShowCreateDialog(true);
  };

  const handleEditPlaylist = (playlist) => {
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      content_items: playlist.content_items || [],
      transition_effect: playlist.transition_effect || 'fade'
    });
    setEditingPlaylist(playlist);
    setShowCreateDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlaylist) {
        await Playlist.update(editingPlaylist.id, formData);
      } else {
        await Playlist.create(formData);
      }
      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  };

  const deletePlaylist = async (id) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      try {
        await Playlist.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
  };

  const setActivePlaylist = async (playlistId) => {
    try {
      // First, deactivate all playlists
      await Promise.all(
        playlists.map(playlist =>
          Playlist.update(playlist.id, { is_active: false })
        )
      );

      // Then activate the selected playlist
      await Playlist.update(playlistId, { is_active: true });

      // Update display settings
      const settings = await DisplaySettings.list();
      if (settings.length > 0) {
        await DisplaySettings.update(settings[0].id, {
          active_playlist_id: playlistId
        });
      } else {
        await DisplaySettings.create({
          active_playlist_id: playlistId
        });
      }

      loadData();
    } catch (error) {
      console.error('Error setting active playlist:', error);
    }
  };

  const addContentToPlaylist = (contentId) => {
    const content = contentItems.find(item => item.id === contentId);
    if (content) {
      setFormData(prev => ({
        ...prev,
        content_items: [
          ...prev.content_items,
          {
            content_id: contentId,
            duration: content.duration,
            order: prev.content_items.length
          }
        ]
      }));
    }
  };

  const removeContentFromPlaylist = (index) => {
    setFormData(prev => ({
      ...prev,
      content_items: prev.content_items.filter((_, i) => i !== index)
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.content_items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFormData(prev => ({
      ...prev,
      content_items: updatedItems
    }));
  };

  const getContentIcon = (type) => {
    const icons = {
      image: Image,
      video: Video,
      webpage: Globe,
      youtube: Youtube,
      text: FileText,
      pdf: FileText // Assuming FileText for PDF for now
    };
    return icons[type] || FileText;
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

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-800/70 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-slate-800/70 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse glass-effect">
              <CardContent className="p-6">
                <div className="h-6 bg-slate-800/70 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-800/70 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-800/70 rounded w-1/2"></div>
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
            <h1 className="text-3xl font-bold text-white mb-2">Playlists</h1>
            <p className="text-gray-300">Create and manage content schedules for your displays</p>
          </div>
          <Button
            onClick={handleCreatePlaylist}
            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-800/70 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <PlayCircle className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No playlists yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Create your first playlist to start scheduling content for your digital displays
            </p>
            <Button
              onClick={handleCreatePlaylist}
              className="bg-orange-500 hover:bg-orange-600 text-white border-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="glass-effect hover:border-white/20 transition-all duration-300 cursor-pointer"
                onClick={() => handleEditPlaylist(playlist)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-6 h-6 text-orange-400" />
                      {playlist.is_active && (
                        <Badge className="bg-green-500/20 text-green-400 animate-pulse">
                          <Radio className="w-3 h-3 mr-1" />
                          LIVE
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {/* Removed Edit button as the entire card is now clickable for editing */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card's onClick from firing
                          deletePlaylist(playlist.id);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-white mt-2">
                    {playlist.name}
                  </CardTitle>
                  {playlist.description && (
                    <p className="text-gray-300 text-sm">{playlist.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {playlist.content_items?.length || 0} items
                      </span>
                      <span className="text-gray-400">
                        ~{playlist.content_items?.reduce((total, item) => total + (item.duration || 10), 0) || 0}s total
                      </span>
                    </div>

                    {playlist.content_items && playlist.content_items.length > 0 && (
                      <div className="space-y-2">
                        {playlist.content_items.slice(0, 3).map((item, index) => {
                          const content = contentItems.find(c => c.id === item.content_id);
                          if (!content) return null;

                          const IconComponent = getContentIcon(content.type);
                          return (
                            <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                              <div className="w-6 h-6 bg-slate-800/70 rounded flex items-center justify-center">
                                <IconComponent className="w-3 h-3 text-gray-300" />
                              </div>
                              <span className="text-sm text-gray-200 flex-1 truncate">
                                {content.title}
                              </span>
                              <span className="text-xs text-gray-400">
                                {item.duration}s
                              </span>
                            </div>
                          );
                        })}
                        {playlist.content_items.length > 3 && (
                          <div className="text-center text-sm text-gray-400 py-2">
                            +{playlist.content_items.length - 3} more items
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2">
                      {playlist.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 w-full justify-center py-2">
                          <Radio className="w-4 h-4 mr-2" />
                          Currently Broadcasting
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => setActivePlaylist(playlist.id)}
                          className="w-full bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-200 border border-green-500/30"
                          disabled={!playlist.content_items || playlist.content_items.length === 0}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Set as Active
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col glass-effect border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>
                {editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Set up your content schedule for digital signage display
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex-1 flex gap-6 min-h-0">
              {/* Left Side - Playlist Items (Full Height) */}
              <div className="w-1/3 flex flex-col">
                <Label className="mb-2">Playlist Items ({formData.content_items.length})</Label>
                <div className="flex-1 overflow-y-auto border rounded-lg bg-black/30 border-white/10">
                  {formData.content_items.length === 0 ? (
                    <div className="flex items-center justify-center h-full p-6 text-center text-red-400">
                      <div>
                        <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-75" />
                        <p className="text-lg font-semibold text-red-500">There is no content in this playlist</p>
                        <p className="text-sm text-red-400 mt-2">Add content from the right panel</p>
                      </div>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="playlist-items">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="p-3 space-y-2">
                            {formData.content_items.map((item, index) => {
                              const content = contentItems.find(c => c.id === item.content_id);
                              if (!content) return null;

                              const IconComponent = getContentIcon(content.type);
                              return (
                                <Draggable key={item.content_id} draggableId={item.content_id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 ${
                                        snapshot.isDragging ? 'shadow-lg bg-white/10' : ''
                                      }`}
                                    >
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                      <div className="w-8 h-8 bg-slate-800/70 rounded-lg flex items-center justify-center">
                                        <IconComponent className="w-4 h-4 text-gray-300" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-200">{content.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Clock className="w-3 h-3 text-gray-400" />
                                          <span className="text-xs text-gray-400">{item.duration}s</span>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeContentFromPlaylist(index)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </div>

              {/* Right Side - Form Fields and Available Content */}
              <div className="flex-1 flex flex-col space-y-6 min-h-0">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Playlist Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter playlist name"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="transition">Transition Effect</Label>
                      <Select
                        value={formData.transition_effect}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, transition_effect: value }))}
                      >
                        <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white focus:border-orange-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-effect text-white border-white/20">
                          <SelectItem value="fade" className="hover:bg-white/10">Fade</SelectItem>
                          <SelectItem value="slide" className="hover:bg-white/10">Slide</SelectItem>
                          <SelectItem value="dissolve" className="hover:bg-white/10">Dissolve</SelectItem>
                          <SelectItem value="ripple" className="hover:bg-white/10">Ripple</SelectItem>
                          <SelectItem value="zoom" className="hover:bg-white/10">Zoom</SelectItem>
                          <SelectItem value="flip" className="hover:bg-white/10">Flip</SelectItem>
                          <SelectItem value="none" className="hover:bg-white/10">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description for this playlist"
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Available Content */}
                <div className="flex flex-col flex-1 min-h-0">
                  <Label>Available Content</Label>
                  <div className="mt-2 flex-1 overflow-y-auto border rounded-lg bg-black/30 border-white/10">
                    {contentItems.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No content available</p>
                        <p className="text-sm">Upload some content first</p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {contentItems.map((content) => {
                          const IconComponent = getContentIcon(content.type);
                          const isAdded = formData.content_items.some(item => item.content_id === content.id);
                          return (
                            <div
                              key={content.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                isAdded
                                  ? 'bg-blue-500/20 border border-blue-500/30'
                                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
                              }`}
                              onClick={() => !isAdded && addContentToPlaylist(content.id)}
                            >
                              <div className="w-8 h-8 bg-slate-800/70 rounded-lg flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-gray-300" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-200">{content.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getTypeColor(content.type)} variant="secondary">
                                    {content.type}
                                  </Badge>
                                  <span className="text-xs text-gray-400">{content.duration}s</span>
                                </div>
                              </div>
                              {!isAdded && <Plus className="w-4 h-4 text-gray-400" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
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
                    disabled={!formData.name || formData.content_items.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {editingPlaylist ? 'Update Playlist' : 'Create Playlist'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
