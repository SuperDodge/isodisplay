'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCSRF } from '@/hooks/useCSRF';
import { useEffect, useState, use } from 'react';
import { PlaylistBuilder } from '@/components/playlist/PlaylistBuilder';
import { Playlist } from '@/types/playlist';
import { 
  apiToFrontendPlaylist, 
  frontendToApiUpdatePlaylist,
  validateApiPlaylistResponse 
} from '@/lib/transformers/api-transformers';

export default function EditPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const { secureFetch } = useCSRF();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

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
    fetchPlaylist();
  }, [user, authLoading, router, id]);

  const fetchPlaylist = async () => {
    try {
      const response = await secureFetch(`/api/playlists/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched playlist data:', data);
        
        // Validate and transform the API response
        if (validateApiPlaylistResponse(data)) {
          const transformedPlaylist = apiToFrontendPlaylist(data);
          console.log('Transformed playlist:', transformedPlaylist);
          setPlaylist(transformedPlaylist);
        } else {
          console.error('Invalid playlist data received from API');
          router.push('/playlists');
        }
      } else {
        console.error('Failed to fetch playlist');
        router.push('/playlists');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      router.push('/playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedPlaylist: Playlist) => {
    try {
      // Transform the playlist data back to API format
      const apiPayload = frontendToApiUpdatePlaylist(updatedPlaylist);

      const response = await secureFetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        // Navigate without triggering unsaved changes dialog
        router.push('/playlists');
      } else {
        console.error('Failed to update playlist');
        // Keep user on page if save failed
      }
    } catch (error) {
      console.error('Error updating playlist:', error);
      // Keep user on page if save failed
    }
  };

  const handlePreview = (playlist: Playlist) => {
    // Handle full-screen preview
    console.log('Preview playlist:', playlist);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Playlist not found</div>
      </div>
    );
  }

  return (
    <PlaylistBuilder
      playlistId={id}
      initialPlaylist={playlist}
      onSave={handleSave}
      onPreview={handlePreview}
    />
  );
}