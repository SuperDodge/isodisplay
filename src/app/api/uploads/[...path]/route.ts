import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { env as appEnv } from '@/lib/env';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Auth is optional here to support public display viewing
    const user = await getCurrentUser();

    const { path: pathSegments } = await params;
    
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Resolve uploads directory path
    const uploadsBasePath = (() => {
      try {
        // Prefer validated env FILE_STORAGE_PATH
        if (appEnv.FILE_STORAGE_PATH) {
          return path.isAbsolute(appEnv.FILE_STORAGE_PATH)
            ? appEnv.FILE_STORAGE_PATH
            : path.join(process.cwd(), appEnv.FILE_STORAGE_PATH);
        }
      } catch {}
      // Fallbacks
      const fallback = process.env.FILE_STORAGE_PATH;
      if (fallback) {
        return path.isAbsolute(fallback)
          ? fallback
          : path.join(process.cwd(), fallback);
      }
      return path.join(process.cwd(), 'uploads');
    })();
    
    // Reconstruct the file path
    const filePath = path.join(uploadsBasePath, ...pathSegments);

    // Security check: ensure the path is within the uploads directory
    const uploadsDir = path.resolve(uploadsBasePath);
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Always require that the requested file maps to a known Content or Thumbnail record
    // Build relative path (portion after /uploads/)
    const filePathStr = pathSegments.join('/');
    let contentOwnerId: string | null = null;

    // Look up by Content.filePath
    const content = await prisma.content.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { filePath: { contains: filePathStr } },
          { filePath: { endsWith: filePathStr } },
        ],
      },
      select: { id: true, uploadedBy: true },
    });

    if (content) {
      contentOwnerId = content.uploadedBy;
    } else {
      // Try FileThumbnail.filePath match, then fetch owning content
      const thumb = await prisma.fileThumbnail.findFirst({
        where: {
          OR: [
            { filePath: { contains: filePathStr } },
            { filePath: { endsWith: filePathStr } },
          ],
        },
        select: { contentId: true },
      });
      if (thumb) {
        const owning = await prisma.content.findUnique({
          where: { id: thumb.contentId },
          select: { uploadedBy: true },
        });
        contentOwnerId = owning?.uploadedBy || null;
      }
    }

    if (!contentOwnerId) {
      // Hide existence of unknown files
      return new NextResponse('Not Found', { status: 404 });
    }

    // If logged in, enforce permissions; otherwise allow for display viewers
    if (user) {
      const hasPermission = (
        user.permissions?.includes('CONTENT_VIEW') ||
        user.permissions?.includes('CONTENT_CREATE') ||
        user.permissions?.includes('USER_CONTROL') ||
        contentOwnerId === user.id
      );
      if (!hasPermission) {
        return new NextResponse('Access denied', { status: 403 });
      }
    }

    try {
      // Check if file exists
      await fs.access(resolvedPath);
      
      // Read the file
      const fileBuffer = await fs.readFile(resolvedPath);
      
      // Determine content type based on file extension
      const ext = path.extname(resolvedPath).toLowerCase();
      const mediaTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.pdf': 'application/pdf',
      };
      const contentType = mediaTypes[ext] || 'application/octet-stream';
      const inlineTypes = new Set(Object.values(mediaTypes));
      const disposition = inlineTypes.has(contentType)
        ? 'inline'
        : `attachment; filename="${path.basename(resolvedPath)}"`;
      
      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'X-Content-Type-Options': 'nosniff',
          'Content-Disposition': disposition,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error('Error reading file:', resolvedPath, error);
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
