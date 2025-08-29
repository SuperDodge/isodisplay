'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  WebSocketMessage,
  PlaylistUpdateMessage,
  DisplayControlMessage,
  StatusUpdateMessage,
  EmergencyStopMessage
} from '@/types/websocket';

interface UseWebSocketOptions {
  displayId?: string;
  displayUrl?: string;
  isAdmin?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  sendMessage: (type: string, data: any) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): WebSocketHookReturn {
  const {
    displayId,
    displayUrl,
    isAdmin = false,
    autoReconnect = true,
    reconnectInterval = 5000
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const maxReconnectDelay = 30000; // 30 seconds max delay

  const connect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }

    setConnectionStatus('connecting');

    const newSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 10000,
      forceNew: true,
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0; // Reset attempts on successful connection

      // Register the client
      if (isAdmin) {
        newSocket.emit('register_admin');
      } else if (displayId && displayUrl) {
        newSocket.emit('register_display', { displayId, displayUrl });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');

      // Auto-reconnect if enabled and disconnection wasn't intentional
      if (autoReconnect && shouldReconnectRef.current && reason !== 'io client disconnect') {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          // Calculate exponential backoff delay
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelay
          );
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');

      // Auto-reconnect on connection error with exponential backoff
      if (autoReconnect && shouldReconnectRef.current) {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          // Calculate exponential backoff delay
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelay
          );
          
          console.log(`Reconnecting after error in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, delay);
        } else {
          console.error('Max reconnection attempts reached after error');
        }
      }
    });

    newSocket.on('registered', (data) => {
      console.log('WebSocket registration confirmed:', data);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    });

    // Listen for all message types
    const messageTypes = [
      'playlist_update',
      'display_control',
      'status_update',
      'emergency_stop',
      'heartbeat_ack'
    ];

    messageTypes.forEach(type => {
      newSocket.on(type, (message: WebSocketMessage) => {
        setLastMessage({ ...message, type: type as any });
      });
    });

    setSocket(newSocket);
  }, [displayId, displayUrl, isAdmin, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [socket]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0; // Reset attempts when manually reconnecting
    connect();
  }, [connect]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(type, data);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [socket, isConnected]);

  // Initialize connection
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect
  };
}

// Hook specifically for display players
export function useDisplayWebSocket(displayId: string, displayUrl: string) {
  const webSocket = useWebSocket({
    displayId,
    displayUrl,
    isAdmin: false,
    autoReconnect: true,
    reconnectInterval: 5000
  });

  const sendHeartbeat = useCallback(() => {
    webSocket.sendMessage('heartbeat', { displayId });
  }, [webSocket.sendMessage, displayId]);

  const sendStatusUpdate = useCallback((status: 'playing' | 'paused' | 'error', currentItem?: number) => {
    webSocket.sendMessage('status_update', {
      displayId,
      status,
      currentItem,
      timestamp: new Date().toISOString()
    });
  }, [webSocket.sendMessage, displayId]);

  // Send periodic heartbeats
  useEffect(() => {
    if (webSocket.isConnected) {
      const heartbeatInterval = setInterval(sendHeartbeat, 30000); // Every 30 seconds
      sendHeartbeat(); // Send initial heartbeat
      
      return () => clearInterval(heartbeatInterval);
    }
  }, [webSocket.isConnected, sendHeartbeat]);

  return {
    ...webSocket,
    sendHeartbeat,
    sendStatusUpdate
  };
}

// Hook specifically for admin interface
export function useAdminWebSocket() {
  const webSocket = useWebSocket({
    isAdmin: true,
    autoReconnect: true,
    reconnectInterval: 3000
  });

  const sendPlaylistUpdate = useCallback((playlistId: string, displayIds: string[]) => {
    webSocket.sendMessage('playlist_update', {
      playlistId,
      displayIds
    });
  }, [webSocket.sendMessage]);

  const sendDisplayControl = useCallback((
    displayId: string, 
    action: 'play' | 'pause' | 'stop' | 'restart' | 'next' | 'previous' | 'seek',
    value?: number
  ) => {
    webSocket.sendMessage('display_control', {
      displayId,
      action,
      value
    });
  }, [webSocket.sendMessage]);

  const sendEmergencyStop = useCallback((reason: string, displayIds: string[] | 'all' = 'all') => {
    webSocket.sendMessage('emergency_stop', {
      reason,
      displayIds
    });
  }, [webSocket.sendMessage]);

  return {
    ...webSocket,
    sendPlaylistUpdate,
    sendDisplayControl,
    sendEmergencyStop
  };
}