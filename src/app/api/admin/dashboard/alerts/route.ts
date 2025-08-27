import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { prisma } from '@/lib/prisma';

// Mock alert storage (in production, this would be a database table or Redis)
const alertsStore: any[] = [];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate some sample alerts based on current system state
    const alerts = await generateSampleAlerts();
    
    // In production, you'd fetch from a persistent store
    return NextResponse.json(alerts);

  } catch (error) {
    console.error('Alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateSampleAlerts() {
  const alerts = [];

  // Check for offline displays
  const offlineDisplays = await prisma.display.findMany({
    where: { 
      isOnline: false,
      lastSeen: {
        lt: new Date(Date.now() - 5 * 60 * 1000) // Offline for more than 5 minutes
      }
    },
    take: 5
  });

  offlineDisplays.forEach(display => {
    alerts.push({
      id: `display_offline_${display.id}`,
      type: 'warning',
      category: 'display',
      title: 'Display Offline',
      message: `Display has been offline for more than 5 minutes`,
      timestamp: display.lastSeen?.toISOString() || new Date().toISOString(),
      acknowledged: false,
      displayName: display.name
    });
  });

  // Check for displays without playlists
  const displaysWithoutPlaylist = await prisma.display.findMany({
    where: { 
      isOnline: true,
      playlistId: null 
    },
    take: 3
  });

  displaysWithoutPlaylist.forEach(display => {
    alerts.push({
      id: `no_playlist_${display.id}`,
      type: 'warning',
      category: 'display',
      title: 'No Playlist Assigned',
      message: `Display is online but has no playlist assigned`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      displayName: display.name
    });
  });

  // Check for failed content processing
  const failedContent = await prisma.content.findMany({
    where: { 
      processingStatus: 'FAILED',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    take: 3
  });

  failedContent.forEach(content => {
    alerts.push({
      id: `processing_failed_${content.id}`,
      type: 'error',
      category: 'content',
      title: 'Content Processing Failed',
      message: `Failed to process "${content.name}": ${content.processingError || 'Unknown error'}`,
      timestamp: content.updatedAt.toISOString(),
      acknowledged: false
    });
  });

  // Add some sample system alerts
  if (Math.random() > 0.7) { // 30% chance
    alerts.push({
      id: 'system_disk_space',
      type: 'warning',
      category: 'system',
      title: 'Disk Space Warning',
      message: 'Disk usage is above 80%. Consider cleaning up old files.',
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
  }

  if (Math.random() > 0.8) { // 20% chance
    alerts.push({
      id: 'system_high_memory',
      type: 'warning',
      category: 'system',
      title: 'High Memory Usage',
      message: 'Memory usage is above 85%. System performance may be affected.',
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
  }

  // Sort by timestamp (newest first)
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}