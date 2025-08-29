import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let clearedItems = [];
    let errors = [];

    // 1. Clear Next.js cache
    try {
      const nextCachePath = path.join(process.cwd(), '.next/cache');
      await fs.rm(nextCachePath, { recursive: true, force: true });
      clearedItems.push('Next.js cache');
    } catch (error) {
      console.error('Failed to clear Next.js cache:', error);
      errors.push('Next.js cache');
    }

    // 2. Clear thumbnail files from database and filesystem
    try {
      // Get all thumbnails from database
      const thumbnails = await prisma.fileThumbnail.findMany({
        select: {
          id: true,
          filePath: true,
        },
      });

      // Delete thumbnail files from filesystem
      const uploadPath = process.env.FILE_STORAGE_PATH || path.join(process.cwd(), 'uploads');
      let deletedCount = 0;
      
      for (const thumbnail of thumbnails) {
        // Only delete if it's a local file path (not a URL)
        if (thumbnail.filePath && !thumbnail.filePath.startsWith('http')) {
          const fullPath = path.join(uploadPath, thumbnail.filePath);
          try {
            await fs.unlink(fullPath);
            deletedCount++;
          } catch (error) {
            // File might not exist, ignore
            console.log(`Thumbnail file not found: ${fullPath}`);
          }
        }
      }

      // Clear thumbnail records from database
      await prisma.fileThumbnail.deleteMany({});
      
      clearedItems.push(`${deletedCount} thumbnail files`);
      clearedItems.push(`${thumbnails.length} thumbnail database records`);
    } catch (error) {
      console.error('Failed to clear thumbnails:', error);
      errors.push('thumbnails');
    }

    // 3. Clear temporary upload files (older than 24 hours)
    try {
      const uploadPath = process.env.FILE_STORAGE_PATH || path.join(process.cwd(), 'uploads');
      const tempPath = path.join(uploadPath, 'temp');
      
      try {
        const files = await fs.readdir(tempPath);
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        let tempFilesDeleted = 0;

        for (const file of files) {
          const filePath = path.join(tempPath, file);
          const stats = await fs.stat(filePath);
          
          // Delete files older than 24 hours
          if (now - stats.mtimeMs > oneDayMs) {
            await fs.unlink(filePath);
            tempFilesDeleted++;
          }
        }
        
        if (tempFilesDeleted > 0) {
          clearedItems.push(`${tempFilesDeleted} temporary files`);
        }
      } catch (error) {
        // Temp directory might not exist
        console.log('Temp directory not found or empty');
      }
    } catch (error) {
      console.error('Failed to clear temporary files:', error);
      errors.push('temporary files');
    }

    // 4. Clear any cached session data (if applicable)
    try {
      // Clear expired sessions from database
      const expiredSessions = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      
      if (expiredSessions.count > 0) {
        clearedItems.push(`${expiredSessions.count} expired sessions`);
      }
    } catch (error) {
      // Session table might not exist, ignore
      console.log('No session table found or error clearing sessions');
    }

    // 5. Reset any in-memory caches (if your app uses any)
    // This would be application-specific
    
    // Build response message
    let message = 'Cache cleared successfully';
    if (clearedItems.length > 0) {
      message += `: ${clearedItems.join(', ')}`;
    }
    if (errors.length > 0) {
      message += `. Failed to clear: ${errors.join(', ')}`;
    }

    return NextResponse.json({
      success: true,
      message,
      clearedItems,
      errors,
    });
  } catch (error) {
    console.error('Cache clear endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}