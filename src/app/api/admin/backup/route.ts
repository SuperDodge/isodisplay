import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

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

    // Construct pg_dump command
    let pgDumpCommand: string;
    
    if (databaseUrl.startsWith('prisma+postgres://')) {
      // For Prisma Postgres development database
      pgDumpCommand = `PGPASSWORD=postgres pg_dump -h localhost -p 51214 -U postgres -d template1 --no-owner --no-acl > "${backupPath}"`;
    } else {
      // For regular PostgreSQL database
      const host = connectionUrl.hostname || 'localhost';
      const port = connectionUrl.port || '5432';
      const username = connectionUrl.username || 'postgres';
      const password = connectionUrl.password || '';
      const database = connectionUrl.pathname.slice(1) || 'isodisplay';

      pgDumpCommand = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-acl > "${backupPath}"`;
    }

    try {
      // Execute pg_dump
      await execAsync(pgDumpCommand);
      
      // Read the backup file
      const backupData = await fs.readFile(backupPath);
      
      // Clean up temp file
      await fs.unlink(backupPath).catch(() => {}); // Ignore errors if file doesn't exist
      
      // Return the backup as a downloadable file
      return new NextResponse(backupData, {
        status: 200,
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="${backupFileName}"`,
        },
      });
    } catch (error) {
      console.error('Database backup error:', error);
      
      // Clean up temp file if it exists
      await fs.unlink(backupPath).catch(() => {});
      
      // Check if pg_dump is available
      if (error.message?.includes('pg_dump: command not found') || error.message?.includes('not found')) {
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