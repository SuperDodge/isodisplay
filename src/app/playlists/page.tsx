'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCSRF } from '@/hooks/useCSRF';
import { Plus, ListVideo, Clock, Play, Pause, Edit, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { apiToFrontendPlaylist } from '@/lib/transformers/api-transformers';
import type { Playlist } from '@/types/playlist';

export default function PlaylistsPage() {
  const { user, loading: authLoading } = useAuth();
  const { secureFetch } = useCSRF();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!user.permissions?.includes('PLAYLIST_CREATE')) {
      router.push('/unauthorized');
      return;
    }
    fetchPlaylists();
  }, [user, authLoading, router]);

  const fetchPlaylists = async () => {
    try {
      const response = await secureFetch('/api/playlists');
      if (response.ok) {
        const data = await response.json();
        // Transform API responses to frontend format
        const transformedPlaylists = Array.isArray(data) 
          ? data.map(apiToFrontendPlaylist)
          : [];
        setPlaylists(transformedPlaylists);
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (playlist: Playlist) => {
    setPlaylistToDelete({ id: playlist.id, name: playlist.name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!playlistToDelete) return;
    
    const playlistId = playlistToDelete.id;
    setDeleteConfirmOpen(false);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const response = await secureFetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPlaylists(playlists.filter(p => p.id !== playlistId));
        
        // Show success message
        setSuccessMessage('Playlist deleted successfully');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const errorText = await response.text();
        console.error('Failed to delete playlist. Status:', response.status, 'Error:', errorText);
        
        // Show error message
        setErrorMessage('Failed to delete playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      setErrorMessage('An error occurred while deleting the playlist.');
    }
    
    setPlaylistToDelete(null);
  };

  const handleDuplicate = async (playlistId: string) => {
    try {
      const response = await secureFetch(`/api/playlists/${playlistId}/duplicate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchPlaylists(); // Refresh the list
      } else {
        console.error('Failed to duplicate playlist');
      }
    } catch (error) {
      console.error('Error duplicating playlist:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 backdrop-blur-md rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top">
          <Check className="w-6 h-6 text-white" />
          <span className="text-white font-bold">{successMessage}</span>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-md rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top">
          <AlertTriangle className="w-6 h-6 text-white" />
          <span className="text-white font-bold">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="ml-2 text-white hover:text-white/80"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Playlists</h1>
          <p className="text-white/70">Create and manage content playlists for your displays</p>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-96">
            <Input
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <Button
            onClick={() => router.push('/playlists/new')}
            className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.length === 0 ? (
            <Card className="col-span-full bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-12 text-center">
                <ListVideo className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
                <p className="text-white/70 mb-6">Create your first playlist to get started</p>
                <Button 
                  onClick={() => router.push('/playlists/new')}
                  className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Playlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            playlists
              .filter(playlist => 
                playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((playlist) => (
                <Card key={playlist.id} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <ListVideo className="w-5 h-5 text-brand-orange-500" />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDuplicate(playlist.id)}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => router.push(`/playlists/${playlist.id}/edit`)}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(playlist)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">{playlist.name}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-white/70">
                        <Clock className="w-4 h-4" />
                        <span>{playlist.items?.length || 0} items</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/70">
                        <Play className="w-4 h-4" />
                        <span>{playlist.displays?.length || 0} displays</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-white/50">
                        Created by {playlist.creator?.username || 'Unknown'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
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
                Delete Playlist
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-300 pt-2 font-body">
              Are you sure you want to delete "{playlistToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="text-white hover:bg-white/10 hover:text-white font-body"
              onClick={() => setPlaylistToDelete(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white font-body"
            >
              Delete Playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}