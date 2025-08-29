'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FilterableSelect } from '@/components/ui/filterable-select';
import { Display, CreateDisplayInput, UpdateDisplayInput, RESOLUTION_OPTIONS } from '@/types/display';
import { ClockSettings, ClockConfig } from './ClockSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

interface DisplayModalProps {
  display: Display | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function DisplayModal({ display, isOpen, onClose, onSave }: DisplayModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CreateDisplayInput>({
    name: '',
    location: '',
    resolution: '1920x1080',
    orientation: 'LANDSCAPE',
  });
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [assignedPlaylistId, setAssignedPlaylistId] = useState<string>('');
  const [clockSettings, setClockSettings] = useState<ClockConfig>({
    enabled: false,
    position: 'top-right',
    size: 'medium',
    format: '12h',
    showSeconds: true,
    showDate: false,
    opacity: 80,
    color: '#FFFFFF',
    backgroundColor: '#000000',
    fontFamily: 'digital',
    offsetX: 20,
    offsetY: 20,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (display) {
      setFormData({
        name: display.name,
        location: display.location || '',
        resolution: display.resolution,
        orientation: display.orientation,
      });
      setAssignedPlaylistId(display.assignedPlaylistId || '');
      
      // Load clock settings from display
      if (display.clockSettings && typeof display.clockSettings === 'object') {
        setClockSettings(prev => ({
          ...prev,
          ...(display.clockSettings as any)
        }));
      }
    } else {
      setFormData({
        name: '',
        location: '',
        resolution: '1920x1080',
        orientation: 'LANDSCAPE',
      });
      setAssignedPlaylistId('');
      setClockSettings({
        enabled: false,
        position: 'top-right',
        size: 'medium',
        format: '12h',
        showSeconds: true,
        showDate: false,
        opacity: 80,
        color: '#FFFFFF',
        backgroundColor: '#000000',
        fontFamily: 'digital',
        offsetX: 20,
        offsetY: 20,
      });
    }
  }, [display]);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Display name is required';
    }

    if (formData.name.trim().length < 3) {
      newErrors.name = 'Display name must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      const url = display ? `/api/displays/${display.id}` : '/api/displays';
      const method = display ? 'PUT' : 'POST';

      const body: CreateDisplayInput | UpdateDisplayInput = {
        ...formData,
        assignedPlaylistId: assignedPlaylistId || null,
        clockSettings: clockSettings,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        showToast('success', display ? 'Display updated successfully' : 'Display created successfully');
        onSave();
        onClose(); // Also close the modal after successful save
      } else {
        const error = await response.json();
        const errorMessage = error.message || 'Failed to save display';
        showToast('error', errorMessage);
        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      console.error('Failed to save display:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save display';
      showToast('error', errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <form 
          id="display-form"
          onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {display ? 'Edit Display' : 'Add New Display'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full mt-6">
            <TabsList className="w-full mb-6 p-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
              <TabsTrigger value="general" className="flex-1 text-base font-medium text-white/70 hover:text-white data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent hover:bg-white/5 transition-all py-3">General</TabsTrigger>
              <TabsTrigger value="clock" className="flex-1 text-base font-medium text-white/70 hover:text-white data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent hover:bg-white/5 transition-all py-3">Clock</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-0 pt-4">
              {/* Display Name */}
              <div>
                <Label htmlFor="name" className="text-white">
                  Display Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10 transition-all"
                  placeholder="e.g., Lobby Screen"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-white">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10 transition-all"
                  placeholder="e.g., Building A, Floor 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Resolution */}
                <div>
                  <Label htmlFor="resolution" className="text-white">
                    Resolution
                  </Label>
                  <FilterableSelect
                    value={formData.resolution}
                    onValueChange={(value) => setFormData({ ...formData, resolution: value as any })}
                    options={RESOLUTION_OPTIONS}
                    placeholder="Select resolution"
                    searchPlaceholder="Search resolutions..."
                    triggerClassName="bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all"
                    emptyMessage="No resolutions found."
                  />
                </div>

                {/* Orientation */}
                <div>
                  <Label htmlFor="orientation" className="text-white">
                    Orientation
                  </Label>
                  <FilterableSelect
                    value={formData.orientation}
                    onValueChange={(value) => setFormData({ ...formData, orientation: value as any })}
                    options={[
                      { value: 'LANDSCAPE', label: 'Landscape' },
                      { value: 'PORTRAIT', label: 'Portrait' },
                    ]}
                    placeholder="Select orientation"
                    searchPlaceholder="Search orientation..."
                    triggerClassName="bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all"
                    emptyMessage="No orientations found."
                  />
                </div>
              </div>

              {/* Assigned Playlist */}
              <div>
                <Label htmlFor="playlist" className="text-white">
                  Assigned Playlist
                </Label>
                <FilterableSelect
                  value={assignedPlaylistId}
                  onValueChange={setAssignedPlaylistId}
                  options={playlists.map(p => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  placeholder="Select playlist"
                  searchPlaceholder="Search playlists..."
                  triggerClassName="bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all"
                  emptyMessage="No playlists found."
                />
              </div>
            </TabsContent>

            <TabsContent value="clock" className="space-y-4 mt-0 pt-4">
              <ClockSettings
                settings={clockSettings}
                onChange={setClockSettings}
                resolution={formData.resolution}
              />
            </TabsContent>
          </Tabs>

          {errors.submit && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/50 rounded p-3 mt-4">
              <p className="text-red-300 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/5">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-white/5 backdrop-blur-sm transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="bg-brand-orange-500/90 hover:bg-brand-orange-600 text-white backdrop-blur-sm transition-all shadow-lg hover:shadow-xl"
              onClick={async (e) => {
                if (!saving) {
                  await handleSubmit(e as any);
                }
              }}
            >
              {saving ? 'Saving...' : display ? 'Update Display' : 'Create Display'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DisplayModal;