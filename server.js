const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { jwtVerify } = require('jose');

// Minimal cookie parser
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = decodeURIComponent(pair.slice(idx + 1).trim());
      cookies[key] = val;
    }
  });
  return cookies;
}

function hasAdminPermission(user) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return (
    user.permissions.includes('USER_CONTROL') ||
    user.permissions.includes('SYSTEM_SETTINGS')
  );
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory storage for WebSocket connections
const displayConnections = new Map(); // displayId -> socketId
const adminConnections = new Set(); // socketIds

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Make io instance globally available for API routes
  global.io = io;

  // Enforce NEXTAUTH_SECRET in production
  if (!dev && !process.env.NEXTAUTH_SECRET) {
    console.error('❌ NEXTAUTH_SECRET is required in production. Set the environment variable.');
    process.exit(1);
  }

  const jwtSecret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'development-secret-minimum-32-characters-long'
  );

  // Attach user info to socket if session-token cookie is present
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie || '';
      const cookies = parseCookies(cookieHeader);
      const token = cookies['session-token'];
      if (token) {
        try {
          const { payload } = await jwtVerify(token, jwtSecret);
          socket.data.user = {
            id: payload.id,
            email: payload.email,
            username: payload.username,
            permissions: payload.permissions || [],
          };
        } catch (e) {
          // Invalid token; continue as unauthenticated
          socket.data.user = null;
        }
      }
      return next();
    } catch (err) {
      return next();
    }
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log('🔌 New WebSocket connection:', socket.id);

    // Handle display client registration
    socket.on('register_display', async (data) => {
      try {
        const { displayId, displayUrl } = data;
        console.log('📺 Display registering:', displayId, displayUrl);

        // Verify display exists and URL matches using Prisma Client JS
        try {
          const { PrismaClient } = require('./src/generated/prisma');
          const prisma = new PrismaClient();
          const display = await prisma.display.findUnique({
            where: { urlSlug: displayUrl },
            select: { id: true },
          });
          await prisma.$disconnect();
          if (!display || display.id !== displayId) {
            socket.emit('error', { message: 'Invalid display credentials' });
            return;
          }
        } catch (dbErr) {
          console.error('Display verification error:', dbErr);
          // If DB is unavailable, fail closed for registration
          socket.emit('error', { message: 'Registration failed' });
          return;
        }

        displayConnections.set(displayId, socket.id);
        socket.join(`display:${displayId}`);
        
        console.log(`✅ Display ${displayId} registered with socket ${socket.id}`);
        
        // Notify admins of display coming online
        const statusMessage = {
          type: 'status_update',
          data: {
            displayId,
            status: 'online',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };
        
        io.to('admins').emit('status_update', statusMessage);
        socket.emit('registered', { displayId, status: 'connected' });
      } catch (error) {
        console.error('❌ Error registering display:', error);
        socket.emit('error', { message: 'Registration failed' });
      }
    });

    // Handle admin client registration
    socket.on('register_admin', () => {
      const user = socket.data.user;
      if (!hasAdminPermission(user)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      adminConnections.add(socket.id);
      socket.join('admins');
      console.log('👨‍💼 Admin registered with socket:', socket.id);
      socket.emit('registered', { role: 'admin', status: 'connected' });
    });

    // Handle display status updates from players
    socket.on('status_update', (data) => {
      const message = {
        type: 'status_update',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to admins
      io.to('admins').emit('status_update', message);
    });

    // Handle playlist updates from admin
    socket.on('playlist_update', async (data) => {
      const user = socket.data.user;
      if (!hasAdminPermission(user)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      try {
        const { playlistId, displayIds } = data;
        console.log('📋 Playlist update:', playlistId, 'for displays:', displayIds);
        
        // TODO: Get updated playlist
        // const playlist = await playlistService.getById(playlistId);
        // if (!playlist) {
        //   socket.emit('error', { message: 'Playlist not found' });
        //   return;
        // }

        const message = {
          type: 'playlist_update',
          data: {
            playlistId,
            // playlist,
            displayIds
          },
          timestamp: new Date().toISOString()
        };

        // Send to specific displays
        displayIds.forEach(displayId => {
          io.to(`display:${displayId}`).emit('playlist_update', message);
        });

        // Notify other admins
        socket.to('admins').emit('playlist_update', message);
      } catch (error) {
        console.error('❌ Error handling playlist update:', error);
        socket.emit('error', { message: 'Failed to update playlist' });
      }
    });

    // Handle display control commands from admin
    socket.on('display_control', (data) => {
      const user = socket.data.user;
      if (!hasAdminPermission(user)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      const message = {
        type: 'display_control',
        data,
        targetDisplayId: data.displayId,
        timestamp: new Date().toISOString()
      };

      console.log('🎮 Display control:', data.action, 'for display:', data.displayId);
      io.to(`display:${data.displayId}`).emit('display_control', message);
      
      // Notify other admins
      socket.to('admins').emit('display_control', message);
    });

    // Handle emergency stop
    socket.on('emergency_stop', (data) => {
      const user = socket.data.user;
      if (!hasAdminPermission(user)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      const message = {
        type: 'emergency_stop',
        data,
        timestamp: new Date().toISOString()
      };

      console.log('🚨 Emergency stop:', data.reason);
      
      if (data.displayIds === 'all') {
        io.emit('emergency_stop', message);
      } else {
        data.displayIds.forEach(displayId => {
          io.to(`display:${displayId}`).emit('emergency_stop', message);
        });
      }

      // Notify admins
      io.to('admins').emit('emergency_stop', message);
    });

    // Handle heartbeat from displays
    socket.on('heartbeat', async (data) => {
      try {
        const { displayId } = data;
        
        // TODO: Update last seen in database
        // await displayService.updateLastSeen(displayId);
        
        socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('💓 Error handling heartbeat:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('🔌 WebSocket disconnection:', socket.id);

      // Remove from admin connections
      adminConnections.delete(socket.id);

      // Find and update display status if this was a display connection
      for (const [displayId, socketId] of displayConnections.entries()) {
        if (socketId === socket.id) {
          displayConnections.delete(displayId);
          
          try {
            console.log('📺 Display offline:', displayId);
            
            // TODO: Update display status to offline
            // await displayService.updateStatus(displayId, 'offline');
            
            // Notify admins of display going offline
            const statusMessage = {
              type: 'status_update',
              data: {
                displayId,
                status: 'offline',
                timestamp: new Date().toISOString()
              },
              timestamp: new Date().toISOString()
            };
            
            io.to('admins').emit('status_update', statusMessage);
          } catch (error) {
            console.error('❌ Error updating display status on disconnect:', error);
          }
          break;
        }
      }
    });
  });

  console.log('📡 WebSocket server initialized');

  httpServer
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`📡 WebSocket server initialized on path /socket.io`);
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    io.close();
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    io.close();
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});
