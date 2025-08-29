'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCSRF } from '@/hooks/useCSRF';
import { useEffect } from 'react';
import { PlaylistBuilder } from '@/components/playlist/PlaylistBuilder';
import { Playlist } from '@/types/playlist';
import { frontendToApiCreatePlaylist } from '@/lib/transformers/api-transformers';

export default function NewPlaylistPage() {
  const { user, loading: authLoading } = useAuth();
  const { secureFetch } = useCSRF();
  const router = useRouter();

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
  }, [user, authLoading, router]);

  const handleSave = async (playlist: Playlist) => {
    try {
      // Transform the playlist data to API format
      const apiPayload = frontendToApiCreatePlaylist(playlist);
      
      const response = await secureFetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        // Navigate without triggering unsaved changes dialog
        router.push('/playlists');
      } else {
        console.error('Failed to save playlist');
        // Keep user on page if save failed
      }
    } catch (error) {
      console.error('Error saving playlist:', error);
      // Keep user on page if save failed
    }
  };

  const handlePreview = (playlist: Playlist) => {
    // Handle full-screen preview
    console.log('Preview playlist:', playlist);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <PlaylistBuilder
      onSave={handleSave}
      onPreview={handlePreview}
    />
  );
}