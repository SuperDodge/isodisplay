'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DisplayPlayer from '@/components/player/DisplayPlayer';
import PlayerErrorBoundary from '@/components/player/PlayerErrorBoundary';
import { FallbackContent } from '@/components/player/FallbackContent';
import { Display } from '@/types/display';
import { Playlist } from '@/types/playlist';
import { useSocketConnection } from '@/hooks/useSocketConnection';

export default function DisplayViewerPage() {
  const params = useParams();
  const uniqueUrl = params.url as string;
  const [display, setDisplay] = useState<Display | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Handle remote commands
  const handleRemoteCommand = useCallback((command: any) => {
    switch (command.action) {
      case 'reload':
        window.location.reload();
        break;
      case 'refresh_content':
        fetchDisplay();
        break;
      case 'clear_cache':
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        break;
    }
  }, []);

  // Initialize Socket.io connection
  const { isConnected } = useSocketConnection({
    displayId: display?.id,
    onPlaylistUpdate: (updatedPlaylist) => {
      setPlaylist(updatedPlaylist);
    },
    onDisplayUpdate: (updatedDisplay) => {
      setDisplay(updatedDisplay);
    },
    onContentUpdate: (content) => {
      if (content.refresh) {
        fetchDisplay();
      }
    },
    onCommand: handleRemoteCommand,
    onInitialData: (data) => {
      if (data.display) setDisplay(data.display);
      if (data.playlist) setPlaylist(data.playlist);
    },
    enabled: !!display,
  });

  useEffect(() => {
    if (uniqueUrl) {
      fetchDisplay();
    }
  }, [uniqueUrl]);

  const fetchDisplay = async () => {
    try {
      const response = await fetch(`/api/display/${uniqueUrl}`);
      if (!response.ok) {
        throw new Error('Display not found');
      }
      const data = await response.json();
      setDisplay(data);
      
      if (data.assignedPlaylist) {
        setPlaylist(data.assignedPlaylist);
      } else {
        setError('No playlist assigned to this display');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load display');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <FallbackContent 
        type="loading-error"
        message="Connecting to display server..."
        displayName={uniqueUrl}
      />
    );
  }

  if (error) {
    return (
      <FallbackContent 
        type="network-error"
        message={error}
        displayName={uniqueUrl}
        onRetry={fetchDisplay}
        showRetryButton={true}
      />
    );
  }

  if (!playlist || !display) {
    return (
      <FallbackContent 
        type="no-content"
        message="This display has no content assigned. Please assign a playlist from the admin interface."
        displayName={display?.name || uniqueUrl}
      />
    );
  }

  return (
    <PlayerErrorBoundary 
      displayId={display.id}
      onError={(error, errorInfo) => {
        console.error('Player error:', error, errorInfo);
        // Could send error to monitoring service here
      }}
    >
      <div className="relative w-full h-full">
        <DisplayPlayer display={display} playlist={playlist} />
        {/* Socket Connection Status Indicator */}
        {!isConnected && display && (
          <div className="absolute top-4 right-4 bg-yellow-500/80 text-white px-3 py-1 rounded-lg text-sm animate-pulse">
            Reconnecting...
          </div>
        )}
      </div>
    </PlayerErrorBoundary>
  );
}