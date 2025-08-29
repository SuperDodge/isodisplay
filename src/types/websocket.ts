// WebSocket message types
export interface WebSocketMessage {
  type: 'playlist_update' | 'display_control' | 'heartbeat' | 'status_update' | 'emergency_stop';
  data: any;
  targetDisplayId?: string;
  timestamp: string;
}

export interface PlaylistUpdateMessage extends WebSocketMessage {
  type: 'playlist_update';
  data: {
    playlistId: string;
    playlist: any;
    displayIds: string[];
  };
}

export interface DisplayControlMessage extends WebSocketMessage {
  type: 'display_control';
  data: {
    action: 'play' | 'pause' | 'stop' | 'restart' | 'next' | 'previous' | 'seek';
    value?: number; // For seek action
    displayId: string;
  };
}

export interface StatusUpdateMessage extends WebSocketMessage {
  type: 'status_update';
  data: {
    displayId: string;
    status: 'online' | 'offline' | 'playing' | 'paused' | 'error';
    currentItem?: number;
    timestamp: string;
  };
}

export interface EmergencyStopMessage extends WebSocketMessage {
  type: 'emergency_stop';
  data: {
    reason: string;
    displayIds: string[] | 'all';
  };
}