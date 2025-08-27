import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all statistics in parallel
    const [
      totalDisplays,
      onlineDisplays,
      totalContent,
      totalPlaylists,
      totalUsers,
      recentContent
    ] = await Promise.all([
      prisma.display.count(),
      prisma.display.count({ where: { isOnline: true } }),
      prisma.content.count({ where: { deletedAt: null } }),
      prisma.playlist.count({ where: { isActive: true } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.content.aggregate({
        _sum: { fileSize: true },
        where: { deletedAt: null, fileSize: { not: null } }
      })
    ]);

    // Calculate storage usage
    const totalBytes = recentContent._sum.fileSize || BigInt(0);
    const totalMB = Number(totalBytes) / (1024 * 1024);
    let storageDisplay;
    if (totalMB > 1024) {
      storageDisplay = `${(totalMB / 1024).toFixed(1)} GB`;
    } else {
      storageDisplay = `${totalMB.toFixed(1)} MB`;
    }

    // Calculate system uptime (mock - in real app would come from system metrics)
    const systemUptime = '99.8%';

    // Mock weekly display views (would come from analytics tracking)
    const lastWeekDisplayViews = Math.floor(Math.random() * 10000) + 5000;

    return NextResponse.json({
      totalDisplays,
      onlineDisplays,
      totalContent,
      totalPlaylists,
      totalUsers,
      systemUptime,
      lastWeekDisplayViews,
      contentStorageUsed: storageDisplay
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}