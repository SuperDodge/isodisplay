import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { AlertType, AlertCategory } from '@/generated/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch alerts from database
    const alerts = await prisma.alert.findMany({
      where: {
        resolved: false
      },
      include: {
        display: true,
        user: true
      },
      orderBy: [
        { type: 'desc' }, // Critical first
        { createdAt: 'desc' }
      ],
      take: 50
    });

    // Check for offline displays and create alerts if needed
    await checkOfflineDisplays();
    
    // Check for storage issues
    await checkStorageIssues();
    
    // Check for failed content processing
    await checkFailedContent();

    // Format alerts for frontend
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.type.toLowerCase(),
      category: alert.category.toLowerCase(),
      title: alert.title,
      message: alert.message,
      displayName: alert.display?.name,
      userName: alert.user ? `${alert.user.firstName} ${alert.user.lastName}` : null,
      timestamp: alert.createdAt,
      metadata: alert.metadata
    }));
    
    return NextResponse.json(formattedAlerts);

  } catch (error) {
    console.error('Alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark alert as resolved
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId, resolved = true } = await request.json();

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved,
        resolvedAt: resolved ? new Date() : null,
        resolvedBy: resolved ? user.id : null
      }
    });

    return NextResponse.json({ success: true, alert });

  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// Create new alert
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, category, title, message, displayId, metadata } = await request.json();

    const alert = await prisma.alert.create({
      data: {
        type: type.toUpperCase() as AlertType,
        category: category.toUpperCase() as AlertCategory,
        title,
        message,
        displayId,
        userId: user.id,
        metadata
      }
    });

    return NextResponse.json({ success: true, alert });

  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// Helper functions to check for various issues

async function checkOfflineDisplays() {
  const offlineDisplays = await prisma.display.findMany({
    where: { 
      isOnline: false,
      lastSeen: {
        lt: new Date(Date.now() - 5 * 60 * 1000) // Offline for more than 5 minutes
      }
    }
  });

  for (const display of offlineDisplays) {
    // Check if alert already exists
    const existingAlert = await prisma.alert.findFirst({
      where: {
        displayId: display.id,
        type: AlertType.WARNING,
        category: AlertCategory.DISPLAY,
        resolved: false,
        title: 'Display Offline'
      }
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          type: AlertType.WARNING,
          category: AlertCategory.DISPLAY,
          title: 'Display Offline',
          message: `Display "${display.name}" has been offline for more than 5 minutes`,
          displayId: display.id,
          metadata: {
            lastSeen: display.lastSeen,
            location: display.location
          }
        }
      });
    }
  }
}

async function checkStorageIssues() {
  // Check for large uploads or storage warnings
  const { _sum: { fileSize } } = await prisma.content.aggregate({
    _sum: {
      fileSize: true
    }
  });

  const totalSizeGB = Number(fileSize || 0) / (1024 * 1024 * 1024);
  
  // Warning at 80GB, critical at 95GB (assuming 100GB limit)
  if (totalSizeGB > 95) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        type: AlertType.CRITICAL,
        category: AlertCategory.SYSTEM,
        title: 'Storage Critical',
        resolved: false
      }
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          type: AlertType.CRITICAL,
          category: AlertCategory.SYSTEM,
          title: 'Storage Critical',
          message: `Storage usage is at ${totalSizeGB.toFixed(1)}GB. Immediate action required.`,
          metadata: {
            usageGB: totalSizeGB,
            threshold: 95
          }
        }
      });
    }
  } else if (totalSizeGB > 80) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        type: AlertType.WARNING,
        category: AlertCategory.SYSTEM,
        title: 'Storage Warning',
        resolved: false
      }
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          type: AlertType.WARNING,
          category: AlertCategory.SYSTEM,
          title: 'Storage Warning',
          message: `Storage usage is at ${totalSizeGB.toFixed(1)}GB. Consider cleanup.`,
          metadata: {
            usageGB: totalSizeGB,
            threshold: 80
          }
        }
      });
    }
  }
}

async function checkFailedContent() {
  const failedContent = await prisma.content.findMany({
    where: {
      processingStatus: 'FAILED'
    },
    take: 10
  });

  for (const content of failedContent) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        category: AlertCategory.CONTENT,
        resolved: false,
        metadata: {
          path: ['contentId'],
          equals: content.id
        }
      }
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          type: AlertType.ERROR,
          category: AlertCategory.CONTENT,
          title: 'Content Processing Failed',
          message: `Content "${content.name}" failed to process`,
          metadata: {
            contentId: content.id,
            error: content.processingError,
            uploadedBy: content.uploadedBy
          }
        }
      });
    }
  }
}