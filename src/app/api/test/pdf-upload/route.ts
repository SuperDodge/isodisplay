import { NextRequest, NextResponse } from 'next/server';
import { getFileStorageService } from '@/lib/upload/file-storage';
import { prisma } from '@/lib/prisma';

// Test route for PDF upload - bypasses auth for testing
export async function POST(request: NextRequest) {
  try {
    console.log('Test PDF upload started');
    
    // Get the first admin user for testing
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@isodisplay.local'
      }
    });
    
    if (!adminUser) {
      return NextResponse.json({ error: 'No admin user found. Please run: npx prisma db seed' }, { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const backgroundColor = formData.get('backgroundColor') as string || '#ffffff';
    const pdfScale = formData.get('pdfScale') as string || 'fit';
    const pdfSize = formData.get('pdfSize') as string || 'standard';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = `/tmp/${Date.now()}-${file.name}`;
    
    // Save to temp file
    const { promises: fs } = await import('fs');
    await fs.writeFile(tempPath, buffer);

    const storageService = getFileStorageService();
    
    // Create a mock Multer file object
    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: file.name,
      encoding: '7bit',
      mimetype: file.type,
      size: buffer.length,
      destination: '/tmp',
      filename: file.name,
      path: tempPath,
      buffer: buffer,
      stream: null as any,
    };
    
    // Store the file (this will trigger PDF processing)
    const result = await storageService.storeFile(
      multerFile,
      adminUser.id, // Use actual admin user ID
      {
        title: 'Test PDF',
        description: 'Test PDF upload',
        backgroundColor,
        pdfScale,
        pdfSize,
      }
    );

    // PDF processing happens automatically in file-storage service
    console.log('Test PDF upload completed:', result);
    
    return NextResponse.json({
      success: true,
      id: result.id,
      filePath: result.filePath,
      thumbnails: result.thumbnails || [],
      message: 'PDF uploaded successfully',
    });
  } catch (error) {
    console.error('Test PDF upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}