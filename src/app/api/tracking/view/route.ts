import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      displayId,
      playlistId,
      contentId,
      duration,
      expectedDuration,
      completed,
      skipped = false
    } = body;

    // Validate required fields
    if (!displayId || !playlistId || !contentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create view log entry
    const viewLog = await prisma.viewLog.create({
      data: {
        displayId,
        playlistId,
        contentId,
        duration: duration || 0,
        expectedDuration: expectedDuration || 0,
        completed: completed || false,
        skipped
      }
    });

    // Update display last seen
    await prisma.display.update({
      where: { id: displayId },
      data: { lastSeen: new Date() }
    });

    return NextResponse.json({ success: true, viewLogId: viewLog.id });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}

// Get view analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');
    const contentId = searchParams.get('contentId');
    const displayId = searchParams.get('displayId');
    const timeRange = searchParams.get('timeRange') || '7d'; // 1d, 7d, 30d, all

    // Build where clause
    const where: any = {};
    if (playlistId) where.playlistId = playlistId;
    if (contentId) where.contentId = contentId;
    if (displayId) where.displayId = displayId;

    // Add time range filter
    const now = new Date();
    if (timeRange !== 'all') {
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      where.viewedAt = { gte: startDate };
    }

    // Get view logs with aggregation
    const [viewLogs, totalViews, uniqueDisplays] = await Promise.all([
      prisma.viewLog.findMany({
        where,
        include: {
          content: {
            select: { name: true, type: true }
          },
          playlist: {
            select: { name: true }
          },
          display: {
            select: { name: true }
          }
        },
        orderBy: { viewedAt: 'desc' },
        take: 100
      }),
      prisma.viewLog.count({ where }),
      prisma.viewLog.groupBy({
        by: ['displayId'],
        where,
        _count: true
      })
    ]);

    // Calculate metrics
    const completionRate = viewLogs.length > 0
      ? (viewLogs.filter(v => v.completed).length / viewLogs.length) * 100
      : 0;

    const skipRate = viewLogs.length > 0
      ? (viewLogs.filter(v => v.skipped).length / viewLogs.length) * 100
      : 0;

    const avgViewDuration = viewLogs.length > 0
      ? viewLogs.reduce((sum, v) => sum + v.duration, 0) / viewLogs.length
      : 0;

    // Get top content
    const contentViews = await prisma.viewLog.groupBy({
      by: ['contentId'],
      where,
      _count: {
        contentId: true
      },
      orderBy: {
        _count: {
          contentId: 'desc'
        }
      },
      take: 10
    });

    const topContent = await Promise.all(
      contentViews.map(async (cv) => {
        const content = await prisma.content.findUnique({
          where: { id: cv.contentId },
          select: { name: true, type: true }
        });
        return {
          contentId: cv.contentId,
          name: content?.name || 'Unknown',
          type: content?.type || 'UNKNOWN',
          views: cv._count.contentId
        };
      })
    );

    return NextResponse.json({
      totalViews,
      uniqueDisplays: uniqueDisplays.length,
      completionRate: Math.round(completionRate),
      skipRate: Math.round(skipRate),
      avgViewDuration: Math.round(avgViewDuration),
      topContent,
      recentViews: viewLogs.slice(0, 20)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}