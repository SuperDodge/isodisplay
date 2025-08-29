import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { databaseToApiContent } from '@/lib/transformers/api-transformers';
import { validateUpdateContent, type UpdateContentInput } from '@/lib/validators/content-schemas';
import { validationErrorResponse, ErrorResponses, isValidUUID } from '@/lib/validators/api-validators';
import { promises as fs } from 'fs';


// GET individual content item
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid content ID format');
    }

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        thumbnails: true,
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Transform database response to API format
    const apiResponse = databaseToApiContent(content);

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// UPDATE content item
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid content ID format');
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = validateUpdateContent(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }
    
    const validatedData = validation.data as UpdateContentInput;

    // Check if content exists
    const existingContent = await prisma.content.findUnique({
      where: { id },
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Update content
    const updatedContent = await prisma.content.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        thumbnails: true,
      },
    });

    // Transform database response to API format
    const apiResponse = databaseToApiContent(updatedContent);

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

// DELETE content item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('CONTENT_DELETE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid content ID format');
    }

    // Check if content exists and get thumbnails
    const existingContent = await prisma.content.findUnique({
      where: { id },
      include: {
        thumbnails: true,
      },
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Delete thumbnail records and files
    if (existingContent.thumbnails && existingContent.thumbnails.length > 0) {
      for (const thumbnail of existingContent.thumbnails) {
        // Try to delete the physical file if it's a local file
        if (thumbnail.filePath && !thumbnail.filePath.startsWith('http')) {
          try {
            await fs.unlink(thumbnail.filePath);
            console.log('Deleted thumbnail file:', thumbnail.filePath);
          } catch (error) {
            console.error('Failed to delete thumbnail file:', thumbnail.filePath, error);
            // Continue even if file deletion fails (file might not exist)
          }
        }
      }
      
      // Delete all thumbnail records from database
      await prisma.fileThumbnail.deleteMany({
        where: { contentId: id },
      });
      console.log(`Deleted ${existingContent.thumbnails.length} thumbnail records for content ${id}`);
    }

    // Soft delete the content
    await prisma.content.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}