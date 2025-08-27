import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'development-secret-minimum-32-characters-long'
);

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('session-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Fetch analytics data
    const [
      activeDisplays,
      totalDisplays,
      contentItems,
      playlists,
      playlistItems
    ] = await Promise.all([
      // Count active displays (online in last 5 minutes)
      prisma.display.count({
        where: {
          isOnline: true,
          lastSeen: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      }),
      
      // Count total displays
      prisma.display.count(),
      
      // Count content items (not deleted)
      prisma.content.count({
        where: {
          deletedAt: null
        }
      }),
      
      // Get playlists with their items for analytics
      prisma.playlist.findMany({
        where: {
          isActive: true
        },
        include: {
          items: {
            include: {
              content: {
                select: {
                  name: true,
                  type: true
                }
              }
            }
          },
          displays: {
            select: {
              name: true,
              isOnline: true,
              lastSeen: true
            }
          }
        }
      }),
      
      // Count total playlist items
      prisma.playlistItem.count()
    ]);

    // Calculate uptime percentage (displays online vs total)
    const uptimePercentage = totalDisplays > 0 
      ? Math.round((activeDisplays / totalDisplays) * 100)
      : 0;

    // Calculate content performance based on playlist usage
    const contentPerformance: Record<string, number> = {};
    playlists.forEach(playlist => {
      playlist.items.forEach(item => {
        const contentName = item.content?.name || 'Unknown';
        contentPerformance[contentName] = (contentPerformance[contentName] || 0) + 1;
      });
    });

    // Calculate display activity based on assigned playlists
    const displayActivity: Record<string, number> = {};
    playlists.forEach(playlist => {
      playlist.displays.forEach(display => {
        displayActivity[display.name] = (displayActivity[display.name] || 0) + playlist.items.length;
      });
    });

    // Calculate total views as sum of playlist items times displays
    const totalViews = playlists.reduce((total, playlist) => {
      return total + (playlist.items.length * playlist.displays.length);
    }, 0);

    return NextResponse.json({
      activeDisplays,
      contentItems,
      totalViews,
      uptimePercentage,
      contentPerformance: Object.entries(contentPerformance)
        .map(([name, count]) => ({ name, views: count }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10), // Top 10 content items
      displayActivity: Object.entries(displayActivity)
        .map(([name, count]) => ({ name, views: count }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10), // Top 10 displays
      recentViews: [] // No view tracking yet
    });
    
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}