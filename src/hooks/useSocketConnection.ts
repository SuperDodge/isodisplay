import { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketConnectionOptions {
  displayId?: string;
  onPlaylistUpdate?: (playlist: any) => void;
  onDisplayUpdate?: (display: any) => void;
  onContentUpdate?: (content: any) => void;
  onCommand?: (command: any) => void;
  onInitialData?: (data: { display: any; playlist: any }) => void;
  enabled?: boolean;
}

export function useSocketConnection({
  displayId,
  onPlaylistUpdate,
  onDisplayUpdate,
  onContentUpdate,
  onCommand,
  onInitialData,
  enabled = true,
}: UseSocketConnectionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(() => {
    if (socketRef.current?.connected && displayId) {
      socketRef.current.emit('heartbeat', { displayId });
    }
  }, [displayId]);

  const connect = useCallback(() => {
    if (!enabled || !displayId || socketRef.current?.connected) return;

    socketRef.current = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Subscribe to display
      socket.emit('subscribe_display', displayId);
      
      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      
      // Clear heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    });

    socket.on('initial_data', (data) => {
      console.log('Received initial data:', data);
      onInitialData?.(data);
    });

    socket.on('playlist_update', (message) => {
      console.log('Playlist update:', message);
      // Handle both message.data.playlist and message.payload for compatibility
      const playlist = message.data?.playlist !== undefined ? message.data.playlist : message.payload;
      // Always call the handler, even with null playlist (when "none" is selected)
      onPlaylistUpdate?.(playlist);
    });

    socket.on('display_update', (message) => {
      console.log('Display update:', message);
      // The message IS the display object (we're sending it directly from broadcastDisplayUpdate)
      onDisplayUpdate?.(message);
    });

    socket.on('content_update', (message) => {
      console.log('Content update:', message);
      onContentUpdate?.(message.payload);
    });

    socket.on('command', (message) => {
      console.log('Command received:', message);
      onCommand?.(message.payload);
    });

    socket.on('heartbeat_ack', (data) => {
      setLastHeartbeat(new Date(data.timestamp));
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }, [enabled, displayId, onPlaylistUpdate, onDisplayUpdate, onContentUpdate, onCommand, onInitialData, sendHeartbeat]);

  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled && displayId) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, displayId]); // Don't include connect/disconnect to avoid loops

  return {
    isConnected,
    lastHeartbeat,
    sendHeartbeat,
    socket: socketRef.current,
  };
}