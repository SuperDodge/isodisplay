import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Store active WebSocket connections
const connections = new Map<string, Set<WebSocket>>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: displayId } = await params;

  // Verify display exists
  const display = await prisma.display.findUnique({
    where: { id: displayId },
  });

  if (!display) {
    return new Response('Display not found', { status: 404 });
  }

  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 });
  }

  // WebSocket upgrade handling (Note: This is simplified - actual implementation depends on your server setup)
  // In production, you'd use a proper WebSocket server like Socket.io or a WebSocket-capable edge runtime
  
  // For Next.js App Router, we need to return a proper response
  // The actual WebSocket handling would be done by your server infrastructure
  return new Response('WebSocket endpoint', {
    status: 101,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    },
  });
}

// Helper function to broadcast updates to all connected clients
export async function broadcastToDisplay(displayId: string, message: any) {
  const clients = connections.get(displayId);
  if (clients) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

// Helper function to send command to specific display
export async function sendCommandToDisplay(displayId: string, command: any) {
  await broadcastToDisplay(displayId, {
    type: 'command',
    payload: command,
    timestamp: Date.now(),
  });
}

// Helper function to notify display of playlist update
export async function notifyPlaylistUpdate(displayId: string, playlist: any) {
  await broadcastToDisplay(displayId, {
    type: 'playlist_update',
    payload: playlist,
    timestamp: Date.now(),
  });
}

// Helper function to notify display of settings update
export async function notifyDisplayUpdate(displayId: string, display: any) {
  await broadcastToDisplay(displayId, {
    type: 'display_update',
    payload: display,
    timestamp: Date.now(),
  });
}