import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { displayService } from './display-service';
import { playlistService } from './playlist-service';

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

class WebSocketService {
  private io: SocketIOServer | null = null;
  private displayConnections: Map<string, string> = new Map(); // displayId -> socketId
  private adminConnections: Set<string> = new Set(); // socketIds

  initialize(httpServer: HTTPServer, io?: SocketIOServer) {
    this.io = io || new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    this.io.on('connection', (socket) => {
      console.log('New WebSocket connection:', socket.id);

      // Handle display client registration
      socket.on('register_display', async (data: { displayId: string, displayUrl: string }) => {
        try {
          const { displayId, displayUrl } = data;
          
          // Verify display exists and URL matches
          const display = await displayService.getByUniqueUrl(displayUrl);
          if (!display || display.id !== displayId) {
            socket.emit('error', { message: 'Invalid display credentials' });
            return;
          }

          this.displayConnections.set(displayId, socket.id);
          socket.join(`display:${displayId}`);
          
          // Update display status to online
          await displayService.updateStatus(displayId, 'online');
          
          console.log(`Display ${displayId} registered with socket ${socket.id}`);
          
          // Notify admins of display coming online
          this.broadcastToAdmins({
            type: 'status_update',
            data: {
              displayId,
              status: 'online',
              timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          });

          socket.emit('registered', { displayId, status: 'connected' });
        } catch (error) {
          console.error('Error registering display:', error);
          socket.emit('error', { message: 'Registration failed' });
        }
      });

      // Handle admin client registration
      socket.on('register_admin', () => {
        this.adminConnections.add(socket.id);
        socket.join('admins');
        console.log(`Admin registered with socket ${socket.id}`);
        socket.emit('registered', { role: 'admin', status: 'connected' });
      });

      // Handle display status updates from players
      socket.on('status_update', (data: Omit<StatusUpdateMessage['data'], 'timestamp'>) => {
        const message: StatusUpdateMessage = {
          type: 'status_update',
          data: {
            ...data,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };
        
        // Broadcast to admins
        this.broadcastToAdmins(message);
      });

      // Handle playlist updates from admin
      socket.on('playlist_update', async (data: PlaylistUpdateMessage['data']) => {
        try {
          const { playlistId, displayIds } = data;
          
          // Get updated playlist
          const playlist = await playlistService.getById(playlistId);
          if (!playlist) {
            socket.emit('error', { message: 'Playlist not found' });
            return;
          }

          const message: PlaylistUpdateMessage = {
            type: 'playlist_update',
            data: {
              playlistId,
              playlist,
              displayIds
            },
            timestamp: new Date().toISOString()
          };

          // Send to specific displays
          displayIds.forEach(displayId => {
            this.sendToDisplay(displayId, message);
          });

          // Notify other admins
          socket.to('admins').emit('playlist_update', message);
        } catch (error) {
          console.error('Error handling playlist update:', error);
          socket.emit('error', { message: 'Failed to update playlist' });
        }
      });

      // Handle display control commands from admin
      socket.on('display_control', (data: DisplayControlMessage['data']) => {
        const message: DisplayControlMessage = {
          type: 'display_control',
          data,
          targetDisplayId: data.displayId,
          timestamp: new Date().toISOString()
        };

        this.sendToDisplay(data.displayId, message);
        
        // Notify other admins
        socket.to('admins').emit('display_control', message);
      });

      // Handle emergency stop
      socket.on('emergency_stop', (data: EmergencyStopMessage['data']) => {
        const message: EmergencyStopMessage = {
          type: 'emergency_stop',
          data,
          timestamp: new Date().toISOString()
        };

        if (data.displayIds === 'all') {
          this.io?.emit('emergency_stop', message);
        } else {
          data.displayIds.forEach(displayId => {
            this.sendToDisplay(displayId, message);
          });
        }

        // Notify admins
        this.broadcastToAdmins(message);
      });

      // Handle heartbeat from displays
      socket.on('heartbeat', async (data: { displayId: string }) => {
        try {
          const { displayId } = data;
          
          // Update last seen in database
          const ip = socket.request.headers['x-forwarded-for'] as string || 
                     socket.request.headers['x-real-ip'] as string || 
                     'unknown';
          const userAgent = socket.request.headers['user-agent'] || 'unknown';
          
          await displayService.updateLastSeen(displayId, ip, userAgent);
          
          socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
        } catch (error) {
          console.error('Error handling heartbeat:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log('WebSocket disconnection:', socket.id);

        // Remove from admin connections
        this.adminConnections.delete(socket.id);

        // Find and update display status if this was a display connection
        for (const [displayId, socketId] of this.displayConnections.entries()) {
          if (socketId === socket.id) {
            this.displayConnections.delete(displayId);
            
            try {
              // Update display status to offline
              await displayService.updateStatus(displayId, 'offline');
              
              // Notify admins of display going offline
              this.broadcastToAdmins({
                type: 'status_update',
                data: {
                  displayId,
                  status: 'offline',
                  timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              console.error('Error updating display status on disconnect:', error);
            }
            break;
          }
        }
      });
    });

    console.log('WebSocket server initialized');
  }

  // Send message to specific display
  sendToDisplay(displayId: string, message: WebSocketMessage) {
    if (!this.io) return;
    
    this.io.to(`display:${displayId}`).emit(message.type, message);
  }

  // Broadcast message to all admin clients
  broadcastToAdmins(message: WebSocketMessage) {
    if (!this.io) return;
    
    this.io.to('admins').emit(message.type, message);
  }

  // Broadcast message to all displays
  broadcastToAllDisplays(message: WebSocketMessage) {
    if (!this.io) return;
    
    // Send to all display rooms
    this.displayConnections.forEach((socketId, displayId) => {
      this.io?.to(`display:${displayId}`).emit(message.type, message);
    });
  }

  // Get connected displays
  getConnectedDisplays(): string[] {
    return Array.from(this.displayConnections.keys());
  }

  // Check if display is connected
  isDisplayConnected(displayId: string): boolean {
    return this.displayConnections.has(displayId);
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.io?.engine.clientsCount || 0,
      displayConnections: this.displayConnections.size,
      adminConnections: this.adminConnections.size,
      connectedDisplayIds: Array.from(this.displayConnections.keys())
    };
  }

  // Graceful shutdown
  shutdown() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.displayConnections.clear();
    this.adminConnections.clear();
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;