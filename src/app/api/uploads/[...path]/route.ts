import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Get the uploads directory path
    // Use the hardcoded path for now since env variable isn't loading correctly in App Router
    const uploadsBasePath = '/Users/sronnie/Documents/Coding/IsoDisplay/uploads';
    
    // Reconstruct the file path
    const filePath = path.join(uploadsBasePath, ...pathSegments);

    // Security check: ensure the path is within the uploads directory
    const uploadsDir = path.resolve(uploadsBasePath);
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    try {
      // Check if file exists
      await fs.access(resolvedPath);
      
      // Read the file
      const fileBuffer = await fs.readFile(resolvedPath);
      
      // Determine content type based on file extension
      const ext = path.extname(resolvedPath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
        case '.mp4':
          contentType = 'video/mp4';
          break;
        case '.webm':
          contentType = 'video/webm';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
        case '.html':
          contentType = 'text/html';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.js':
          contentType = 'application/javascript';
          break;
        case '.json':
          contentType = 'application/json';
          break;
      }
      
      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
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