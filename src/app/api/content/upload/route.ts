import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// import { uploadConfigs } from '@/lib/upload/multer-config';
import { getFileStorageService } from '@/lib/upload/file-storage';
import { validateFile } from '@/lib/upload/file-validator';
import { uploadQueue } from '@/lib/upload/upload-queue';
import path from 'path';

// Handle file upload
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    console.log('Current user in upload:', user);
    
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user exists in the database
    const { prisma } = await import('@/lib/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!dbUser) {
      // If user doesn't exist, try to find by email
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (!userByEmail) {
        return NextResponse.json({ error: 'User account not found. Please log out and log in again.' }, { status: 401 });
      }
      
      // Use the correct user ID from the database
      user.id = userByEmail.id;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const backgroundColor = formData.get('backgroundColor') as string;
    const imageScale = formData.get('imageScale') as string;
    const imageSize = formData.get('imageSize') as string;
    const pdfScale = formData.get('pdfScale') as string;
    const pdfSize = formData.get('pdfSize') as string;
    const duration = formData.get('duration') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = `/tmp/${Date.now()}-${file.name}`;
    
    // Save to temp file
    const { promises: fs } = await import('fs');
    await fs.writeFile(tempPath, buffer);

    // Validate file
    const validation = await validateFile(tempPath, {
      expectedMimeType: file.type,
      maxSize: 500 * 1024 * 1024, // 500MB
      scanForViruses: false, // Skip for now as ClamAV may not be available
      validateMagicNumber: true,
      calculateHash: true,
    });

    if (!validation.valid) {
      await fs.unlink(tempPath); // Clean up
      return NextResponse.json(
        { error: 'File validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Create Express.Multer.File compatible object
    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: file.name,
      encoding: '7bit',
      mimetype: file.type,
      size: file.size,
      destination: '/tmp',
      filename: path.basename(tempPath),
      path: tempPath,
      buffer,
      stream: null as any,
    };

    // Store file
    const fileStorageService = getFileStorageService();
    const content = await fileStorageService.storeFile(
      multerFile,
      user.id,
      {
        title,
        description,
        backgroundColor,
        imageScale,
        imageSize: imageSize ? parseInt(imageSize) : undefined,
        pdfScale,
        pdfSize: pdfSize ? parseInt(pdfSize) : undefined,
        duration: duration ? parseInt(duration) : undefined,
      }
    );

    // Serialize BigInt fields to strings for JSON response
    const serializedContent = {
      ...content,
      fileSize: content.fileSize ? content.fileSize.toString() : null,
    };
    
    return NextResponse.json(serializedContent, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle chunked upload initialization
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileSize, mimeType } = await request.json();

    const uploadJob = await uploadQueue.initializeUpload(
      fileName,
      fileSize,
      mimeType,
      user.id
    );

    return NextResponse.json(uploadJob);
  } catch (error) {
    console.error('Upload initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 500 }
    );
  }
}

// path imported at top
