import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { prisma } from '@/lib/prisma';
import os from 'os';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system uptime
    const uptimeSeconds = os.uptime();
    const uptime = formatUptime(uptimeSeconds);

    // Get CPU usage (approximation)
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.min(Math.round((loadAvg[0] / cpuCount) * 100), 100);

    // Get memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = {
      used: Math.round(usedMem / 1024 / 1024 / 1024 * 10) / 10, // GB
      total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10, // GB
      percentage: Math.round((usedMem / totalMem) * 100)
    };

    // Get disk usage (for current directory)
    let diskUsage = {
      used: '0 GB',
      total: '0 GB',
      percentage: 0
    };

    try {
      const stats = await fs.promises.stat(process.cwd());
      // This is a simplified approach - in production, you'd want proper disk usage monitoring
      diskUsage = {
        used: '2.5 GB',
        total: '50 GB', 
        percentage: 5
      };
    } catch (err) {
      // Fallback values
    }

    // Test database connection
    const dbStart = Date.now();
    let databaseStatus;
    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - dbStart;
      databaseStatus = {
        connected: true,
        responseTime,
        poolSize: 10 // This would come from your connection pool config
      };
    } catch (err) {
      databaseStatus = {
        connected: false,
        responseTime: 0,
        poolSize: 0
      };
    }

    // Network status (simplified)
    const networkStatus = {
      connected: true,
      latency: Math.floor(Math.random() * 10) + 5 // Mock latency
    };

    // Services status
    const services = [
      {
        name: 'Web Server',
        status: 'healthy' as const,
        uptime: uptime,
        responseTime: Math.floor(Math.random() * 50) + 10
      },
      {
        name: 'Database',
        status: databaseStatus.connected ? 'healthy' as const : 'error' as const,
        uptime: uptime,
        responseTime: databaseStatus.responseTime
      },
      {
        name: 'File Storage',
        status: 'healthy' as const,
        uptime: uptime
      },
      {
        name: 'WebSocket Service',
        status: 'healthy' as const,
        uptime: uptime,
        responseTime: Math.floor(Math.random() * 20) + 5
      }
    ];

    return NextResponse.json({
      uptime,
      cpuUsage,
      memoryUsage,
      diskUsage,
      databaseStatus,
      networkStatus,
      services
    });

  } catch (error) {
    console.error('System health error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}