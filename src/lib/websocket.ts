import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'playlist_update' | 'display_update' | 'content_update' | 'command' | 'heartbeat';
  payload: any;
  timestamp: number;
}

export interface WebSocketState {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
  heartbeatInterval = 30000,
}: UseWebSocketOptions) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    reconnectAttempts: 0,
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const heartbeatMessage: WebSocketMessage = {
        type: 'heartbeat',
        payload: { timestamp: Date.now() },
        timestamp: Date.now(),
      };
      ws.current.send(JSON.stringify(heartbeatMessage));
    }
  }, []);

  const connect = useCallback(() => {
    try {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return;
      }

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          reconnectAttempts: 0,
        }));
        
        onConnect?.();

        // Start heartbeat
        if (heartbeatInterval > 0) {
          heartbeatTimer.current = setInterval(sendHeartbeat, heartbeatInterval);
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            lastMessage: message,
          }));
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));
        
        // Clear heartbeat
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current);
        }

        onDisconnect?.();

        // Attempt reconnection
        if (reconnect && state.reconnectAttempts < maxReconnectAttempts) {
          reconnectTimer.current = setTimeout(() => {
            setState(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1,
            }));
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }, [url, onConnect, onDisconnect, onError, onMessage, reconnect, reconnectInterval, maxReconnectAttempts, state.reconnectAttempts, heartbeatInterval, sendHeartbeat]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    state,
    sendMessage,
    disconnect,
    connect,
  };
}

// WebSocket provider for display updates
export class DisplayWebSocketManager {
  private static instance: DisplayWebSocketManager;
  private connections: Map<string, WebSocket> = new Map();

  private constructor() {}

  static getInstance(): DisplayWebSocketManager {
    if (!DisplayWebSocketManager.instance) {
      DisplayWebSocketManager.instance = new DisplayWebSocketManager();
    }
    return DisplayWebSocketManager.instance;
  }

  subscribeToDisplay(displayId: string, handlers: {
    onUpdate?: (data: any) => void;
    onCommand?: (command: any) => void;
    onError?: (error: Event) => void;
  }) {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/display/${displayId}`;
    
    if (this.connections.has(displayId)) {
      this.connections.get(displayId)?.close();
    }

    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        switch (message.type) {
          case 'playlist_update':
          case 'display_update':
          case 'content_update':
            handlers.onUpdate?.(message.payload);
            break;
          case 'command':
            handlers.onCommand?.(message.payload);
            break;
        }
      } catch (error) {
        console.error('Failed to handle WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      handlers.onError?.(error);
    };

    this.connections.set(displayId, ws);

    return () => {
      ws.close();
      this.connections.delete(displayId);
    };
  }

  sendCommand(displayId: string, command: any) {
    const ws = this.connections.get(displayId);
    if (ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'command',
        payload: command,
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnectAll() {
    this.connections.forEach(ws => ws.close());
    this.connections.clear();
  }
}