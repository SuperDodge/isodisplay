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
import { useCSRF } from '@/hooks/useCSRF';

interface DisplayModalProps {
  display: Display | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function DisplayModal({ display, isOpen, onClose, onSave }: DisplayModalProps) {
  const { secureFetch } = useCSRF();
  const [formData, setFormData] = useState<CreateDisplayInput>({
    name: '',
    location: '',
    resolution: '1920x1080',
    orientation: 'LANDSCAPE',
  });
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [assignedPlaylistId, setAssignedPlaylistId] = useState<string>('');
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
    } else {
      setFormData({
        name: '',
        location: '',
        resolution: '1920x1080',
        orientation: 'LANDSCAPE',
      });
      setAssignedPlaylistId('');
    }
  }, [display]);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await secureFetch('/api/playlists');
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

    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = display ? `/api/displays/${display.id}` : '/api/displays';
      const method = display ? 'PUT' : 'POST';

      const body: CreateDisplayInput | UpdateDisplayInput = {
        ...formData,
        assignedPlaylistId: assignedPlaylistId || null,
      };

      const response = await secureFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to save display' });
      }
    } catch (error) {
      console.error('Failed to save display:', error);
      setErrors({ submit: 'Failed to save display' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-brand-gray-900/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {display ? 'Edit Display' : 'Add New Display'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <Label htmlFor="name" className="text-white">
              Display Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
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
              className="bg-white/10 border-white/20 text-white"
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
                triggerClassName="bg-white/10 border-white/20 text-white"
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
                triggerClassName="bg-white/10 border-white/20 text-white"
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
              options={[
                { value: '', label: 'None' },
                ...playlists.map(p => ({
                  value: p.id,
                  label: p.name,
                }))
              ]}
              placeholder="Select playlist"
              searchPlaceholder="Search playlists..."
              triggerClassName="bg-white/10 border-white/20 text-white"
              emptyMessage="No playlists found."
            />
          </div>

          {errors.submit && (
            <div className="bg-red-500/20 border border-red-500 rounded p-3">
              <p className="text-red-300 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white"
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