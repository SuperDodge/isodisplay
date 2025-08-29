import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs: { type: string; content: string }[] = [];

    // 1. Next.js Build Logs
    try {
      const nextBuildLog = path.join(process.cwd(), '.next/build-manifest.json');
      const buildManifest = await fs.readFile(nextBuildLog, 'utf-8');
      logs.push({
        type: 'Next.js Build Info',
        content: JSON.stringify(JSON.parse(buildManifest), null, 2),
      });
    } catch (error) {
      console.log('No Next.js build manifest found');
    }

    // 2. PM2 Logs (if running under PM2)
    try {
      const pm2LogPath = path.join(process.env.HOME || '/home', '.pm2/logs');
      const pm2Files = await fs.readdir(pm2LogPath);
      
      for (const file of pm2Files) {
        if (file.includes('isodisplay') || file.includes('out') || file.includes('error')) {
          try {
            const logPath = path.join(pm2LogPath, file);
            const stats = await fs.stat(logPath);
            
            // Only read last 100KB of each log file to avoid memory issues
            const fileSize = Math.min(stats.size, 100 * 1024);
            const buffer = Buffer.alloc(fileSize);
            const fileHandle = await fs.open(logPath, 'r');
            await fileHandle.read(buffer, 0, fileSize, stats.size - fileSize);
            await fileHandle.close();
            
            logs.push({
              type: `PM2: ${file}`,
              content: buffer.toString('utf-8'),
            });
          } catch (error) {
            console.log(`Failed to read PM2 log: ${file}`);
          }
        }
      }
    } catch (error) {
      console.log('No PM2 logs found');
    }

    // 3. NPM Logs
    try {
      const npmLogPath = path.join(process.env.HOME || '/home', '.npm/_logs');
      const npmFiles = await fs.readdir(npmLogPath);
      
      // Get the most recent npm debug log
      if (npmFiles.length > 0) {
        const sortedFiles = npmFiles
          .filter(f => f.endsWith('.log'))
          .sort((a, b) => b.localeCompare(a));
        
        if (sortedFiles.length > 0) {
          const mostRecent = sortedFiles[0];
          const logPath = path.join(npmLogPath, mostRecent);
          const stats = await fs.stat(logPath);
          
          // Read last 50KB of the log
          const fileSize = Math.min(stats.size, 50 * 1024);
          const buffer = Buffer.alloc(fileSize);
          const fileHandle = await fs.open(logPath, 'r');
          await fileHandle.read(buffer, 0, fileSize, stats.size - fileSize);
          await fileHandle.close();
          
          logs.push({
            type: `NPM Debug Log (${mostRecent})`,
            content: buffer.toString('utf-8'),
          });
        }
      }
    } catch (error) {
      console.log('No NPM logs found');
    }

    // 4. Application Error Log (if exists)
    try {
      const errorLogPath = path.join(process.cwd(), 'error.log');
      const errorLog = await fs.readFile(errorLogPath, 'utf-8');
      
      // Get last 1000 lines
      const lines = errorLog.split('\n');
      const last1000Lines = lines.slice(-1000).join('\n');
      
      logs.push({
        type: 'Application Error Log',
        content: last1000Lines,
      });
    } catch (error) {
      console.log('No application error log found');
    }

    // 5. Prisma Query Log (development only)
    if (process.env.NODE_ENV === 'development') {
      logs.push({
        type: 'Database Queries (Recent)',
        content: 'Enable Prisma query logging by setting DEBUG="prisma:query" in your environment variables to see database queries.',
      });
    }

    // 6. System Information
    const systemInfo = {
      'Node Version': process.version,
      'Platform': process.platform,
      'Architecture': process.arch,
      'Environment': process.env.NODE_ENV || 'production',
      'Memory Usage': `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      'Uptime': `${Math.round(process.uptime() / 60)} minutes`,
      'Current Directory': process.cwd(),
      'Database URL': process.env.DATABASE_URL ? 'Configured' : 'Not configured',
      'File Storage Path': process.env.FILE_STORAGE_PATH || 'Default',
    };

    logs.push({
      type: 'System Information',
      content: Object.entries(systemInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
    });

    // 7. Recent Console Output (if captured)
    if (global.consoleBuffer && Array.isArray(global.consoleBuffer)) {
      logs.push({
        type: 'Recent Console Output',
        content: global.consoleBuffer.slice(-500).join('\n'),
      });
    }

    return NextResponse.json({
      success: true,
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Logs endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}