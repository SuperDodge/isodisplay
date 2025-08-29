import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Serve static files from storage with permission validation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params as required in Next.js 15
    const { path: pathSegments } = await params;
    const filePath = pathSegments?.join('/') || '';
    
    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }
    
    console.log('Serving file:', filePath);
    
    // Check if this is a content file and validate access
    // File paths typically include content ID in the path
    const pathParts = filePath.split('/');
    if (pathParts.length > 1) {
      // Try to find content by file path
      const content = await prisma.content.findFirst({
        where: {
          OR: [
            { filePath: { contains: filePath } },
            { filePath: { endsWith: filePath } }
          ]
        }
      });

      if (content) {
        // Check if user has permission to view this content
        const hasPermission = user.permissions?.includes('CONTENT_VIEW') || 
                            user.permissions?.includes('USER_CONTROL') ||
                            content.uploadedBy === user.id;
        
        if (!hasPermission) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    }
    
    // Construct the actual file path
    // Use absolute path to uploads directory
    const projectRoot = '/Users/sronnie/Documents/Coding/IsoDisplay';
    const absolutePath = path.join(projectRoot, 'uploads', filePath);
    
    console.log('Absolute path:', absolutePath);
    
    // Security: Prevent directory traversal
    const normalizedPath = path.resolve(absolutePath);
    const baseDir = path.resolve(projectRoot, 'uploads');
    
    if (!normalizedPath.startsWith(baseDir)) {
      console.log('Path traversal attempt blocked');
      console.log('Normalized:', normalizedPath);
      console.log('Base dir:', baseDir);
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }
    
    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch {
      console.log('File not found:', normalizedPath);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = await fs.readFile(normalizedPath);
    
    // Determine content type
    const ext = path.extname(normalizedPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}