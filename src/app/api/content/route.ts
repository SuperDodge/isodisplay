import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ContentType } from '@/generated/prisma';
import { databaseToApiContent } from '@/lib/transformers/api-transformers';
import { validateContentQuery } from '@/lib/validators/content-schemas';
import { validationErrorResponse, ErrorResponses } from '@/lib/validators/api-validators';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = validateContentQuery(searchParams);
    
    if (!queryValidation.success) {
      return validationErrorResponse(queryValidation.error);
    }
    
    const { search, type, sortBy, sortOrder } = queryValidation.data;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (type && type !== 'all') {
      // Type is already validated by schema
      where.type = type;
    }

    const content = await prisma.content.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        thumbnails: true,  // Get all thumbnails, we'll select display in the transformer
      },
    });

    // Transform database response to API format
    const apiResponse = content.map(databaseToApiContent);

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}