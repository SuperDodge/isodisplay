'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminWebSocket } from '@/hooks/useWebSocket';
import { Wifi, WifiOff, Activity, Send, Square } from 'lucide-react';

interface ConnectionStats {
  connectedDisplays: number;
  totalConnections: number;
  lastActivity: string;
}

export function WebSocketStatus() {
  const {
    isConnected,
    connectionStatus,
    lastMessage,
    sendPlaylistUpdate,
    sendDisplayControl,
    sendEmergencyStop
  } = useAdminWebSocket();

  const [stats, setStats] = useState<ConnectionStats>({
    connectedDisplays: 0,
    totalConnections: 0,
    lastActivity: 'Never'
  });

  const [testDisplayId] = useState('test-display-123');
  const [testPlaylistId] = useState('test-playlist-456');

  // Update stats when we receive status updates
  useEffect(() => {
    if (lastMessage?.type === 'status_update') {
      setStats(prev => ({
        ...prev,
        lastActivity: new Date().toLocaleTimeString(),
        connectedDisplays: prev.connectedDisplays + (lastMessage.data.status === 'online' ? 1 : -1)
      }));
    }
  }, [lastMessage]);

  const handleTestPlaylistUpdate = () => {
    sendPlaylistUpdate(testPlaylistId, [testDisplayId]);
  };

  const handleTestControl = (action: 'play' | 'pause' | 'stop' | 'next') => {
    sendDisplayControl(testDisplayId, action);
  };

  const handleEmergencyStop = () => {
    sendEmergencyStop('Admin test emergency stop', [testDisplayId]);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (isConnected) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          WebSocket Server Status
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {connectionStatus.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected to WebSocket server' : `Status: ${connectionStatus}`}
          </span>
        </div>

        {/* Connection Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-orange-500">{stats.connectedDisplays}</div>
            <div className="text-xs text-gray-600">Connected Displays</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{stats.totalConnections}</div>
            <div className="text-xs text-gray-600">Total Connections</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600">Last Activity</span>
            </div>
            <div className="text-xs font-medium">{stats.lastActivity}</div>
          </div>
        </div>

        {/* Last Message */}
        {lastMessage && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-1">Last Message:</div>
            <div className="text-xs font-mono text-gray-600">
              {lastMessage.type} - {new Date(lastMessage.timestamp).toLocaleTimeString()}
            </div>
            {lastMessage.data && (
              <div className="text-xs text-gray-500 mt-1">
                {JSON.stringify(lastMessage.data, null, 2)}
              </div>
            )}
          </div>
        )}

        {/* Test Controls */}
        {isConnected && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3">Test WebSocket Commands:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleTestPlaylistUpdate}
                className="text-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                Test Playlist Update
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleTestControl('play')}
                className="text-xs"
              >
                ▶️ Play Command
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleTestControl('pause')}
                className="text-xs"
              >
                ⏸️ Pause Command
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleTestControl('next')}
                className="text-xs"
              >
                ⏭️ Next Command
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={handleEmergencyStop}
                className="text-xs col-span-2"
              >
                <Square className="w-3 h-3 mr-1" />
                Test Emergency Stop
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Test commands target display ID: {testDisplayId}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WebSocketStatus;