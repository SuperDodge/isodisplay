import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    // Parse the connection URL
    let connectionUrl: URL;
    try {
      // Handle Prisma Postgres URLs
      if (databaseUrl.startsWith('prisma+postgres://')) {
        // For Prisma Postgres in development, we need to extract the actual PostgreSQL URL
        // The actual database runs on port 51214 by default
        connectionUrl = new URL('postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable');
      } else {
        connectionUrl = new URL(databaseUrl);
      }
    } catch (error) {
      console.error('Failed to parse database URL:', error);
      return NextResponse.json({ error: 'Invalid database configuration' }, { status: 500 });
    }

    // Generate timestamp for backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `isodisplay-backup-${timestamp}.sql`;
    const backupPath = path.join(os.tmpdir(), backupFileName);

    try {
      let stdout: Buffer | string = '';
      if (databaseUrl.startsWith('prisma+postgres://')) {
        const env = { ...process.env, PGPASSWORD: 'postgres' };
        const args = ['-h', 'localhost', '-p', '51214', '-U', 'postgres', '-d', 'template1', '--no-owner', '--no-acl'];
        const res = await execFileAsync('pg_dump', args, { env });
        stdout = res.stdout;
      } else {
        const host = connectionUrl.hostname || 'localhost';
        const port = connectionUrl.port || '5432';
        const username = decodeURIComponent(connectionUrl.username || 'postgres');
        const password = decodeURIComponent(connectionUrl.password || '');
        const database = decodeURIComponent(connectionUrl.pathname.slice(1) || 'isodisplay');
        const env = { ...process.env, PGPASSWORD: password };
        const args = ['-h', host, '-p', port || '5432', '-U', username, '-d', database, '--no-owner', '--no-acl'];
        const res = await execFileAsync('pg_dump', args, { env });
        stdout = res.stdout;
      }

      const dataBuffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
      return new NextResponse(dataBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="${backupFileName}"`,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (error: any) {
      console.error('Database backup error:', error);
      // Check if pg_dump is available
      if (error?.message?.includes('pg_dump') && error?.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'PostgreSQL client tools not installed. Please install postgresql-client.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create database backup' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Backup endpoint error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
