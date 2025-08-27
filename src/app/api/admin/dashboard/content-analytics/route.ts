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

    // Get content statistics by type
    const contentByType = await prisma.content.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _count: {
        id: true
      },
      _sum: {
        fileSize: true
      }
    });

    // Get total count and size
    const totalStats = await prisma.content.aggregate({
      _count: {
        id: true
      },
      _sum: {
        fileSize: true
      },
      where: { deletedAt: null }
    });

    // Get recent uploads (last 10)
    const recentUploads = await prisma.content.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        name: true,
        type: true,
        createdAt: true,
        fileSize: true
      }
    });

    // Get most used content (by playlist usage)
    const mostUsed = await prisma.content.findMany({
      where: { deletedAt: null },
      select: {
        name: true,
        type: true,
        playlistItems: {
          select: { id: true }
        }
      },
      take: 10
    });

    // Process the data
    const totalFiles = totalStats._count.id;
    const totalBytes = Number(totalStats._sum.fileSize || 0);
    const totalSize = formatBytes(totalBytes);

    const byType = contentByType.map(item => {
      const itemBytes = Number(item._sum.fileSize || 0);
      return {
        type: item.type,
        count: item._count.id,
        size: formatBytes(itemBytes),
        percentage: totalFiles > 0 ? (item._count.id / totalFiles) * 100 : 0
      };
    }).sort((a, b) => b.count - a.count);

    const recentUploadsFormatted = recentUploads.map(upload => ({
      name: upload.name,
      type: upload.type,
      uploadedAt: upload.createdAt.toISOString(),
      size: formatBytes(Number(upload.fileSize || 0))
    }));

    const mostUsedContent = mostUsed
      .map(content => ({
        name: content.name,
        type: content.type,
        usageCount: content.playlistItems.length
      }))
      .filter(item => item.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    return NextResponse.json({
      totalFiles,
      totalSize,
      byType,
      recentUploads: recentUploadsFormatted,
      mostUsedContent
    });

  } catch (error) {
    console.error('Content analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}