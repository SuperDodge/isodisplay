import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';

let io: SocketIOServer | null = null;

// Map to track which displays each socket is watching
const socketToDisplay = new Map<string, string>();
const displayToSockets = new Map<string, Set<string>>();

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Handle display subscription
    socket.on('subscribe_display', async (displayId: string) => {
      try {
        // Verify display exists
        const display = await prisma.display.findUnique({
          where: { id: displayId },
        });

        if (!display) {
          socket.emit('error', { message: 'Display not found' });
          return;
        }

        // Track subscription
        socketToDisplay.set(socket.id, displayId);
        
        if (!displayToSockets.has(displayId)) {
          displayToSockets.set(displayId, new Set());
        }
        displayToSockets.get(displayId)?.add(socket.id);

        // Join room for this display
        socket.join(`display:${displayId}`);

        // Send initial data
        const playlist = display.playlistId ? await prisma.playlist.findUnique({
          where: { id: display.playlistId },
          include: {
            items: {
              include: {
                content: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        }) : null;

        socket.emit('initial_data', {
          display,
          playlist,
        });

        // Update last seen
        await prisma.display.update({
          where: { id: displayId },
          data: { lastSeen: new Date() },
        });

        console.log(`Socket ${socket.id} subscribed to display ${displayId}`);
      } catch (error) {
        console.error('Subscription error:', error);
        socket.emit('error', { message: 'Failed to subscribe to display' });
      }
    });

    // Handle heartbeat
    socket.on('heartbeat', async (data: { displayId: string }) => {
      if (data.displayId) {
        try {
          await prisma.display.update({
            where: { id: data.displayId },
            data: { lastSeen: new Date() },
          });
          socket.emit('heartbeat_ack', { timestamp: Date.now() });
        } catch (error) {
          console.error('Heartbeat error:', error);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up subscriptions
      const displayId = socketToDisplay.get(socket.id);
      if (displayId) {
        displayToSockets.get(displayId)?.delete(socket.id);
        if (displayToSockets.get(displayId)?.size === 0) {
          displayToSockets.delete(displayId);
        }
        socketToDisplay.delete(socket.id);
      }
    });
  });

  return io;
}

// Helper functions for broadcasting updates

export function broadcastPlaylistUpdate(displayId: string, playlist: any) {
  if (!io) return;
  
  io.to(`display:${displayId}`).emit('playlist_update', {
    type: 'playlist_update',
    payload: playlist,
    timestamp: Date.now(),
  });
}

export function broadcastDisplayUpdate(displayId: string, display: any) {
  if (!io) return;
  
  io.to(`display:${displayId}`).emit('display_update', {
    type: 'display_update',
    payload: display,
    timestamp: Date.now(),
  });
}

export function broadcastContentUpdate(displayId: string, content: any) {
  if (!io) return;
  
  io.to(`display:${displayId}`).emit('content_update', {
    type: 'content_update',
    payload: content,
    timestamp: Date.now(),
  });
}

export function sendCommandToDisplay(displayId: string, command: any) {
  if (!io) return;
  
  io.to(`display:${displayId}`).emit('command', {
    type: 'command',
    payload: command,
    timestamp: Date.now(),
  });
}

export function getConnectedDisplays(): string[] {
  return Array.from(displayToSockets.keys());
}

export function getSocketsForDisplay(displayId: string): number {
  return displayToSockets.get(displayId)?.size || 0;
}