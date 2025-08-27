import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ContentType } from '@/generated/prisma';
import { z } from 'zod';

// Validation schema for text content
const TextContentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().nullable().optional(),
  content: z.string().min(1, 'Text content is required'),
  fontSize: z.string().optional().default('3rem'),
  fontColor: z.string().optional().default('#ffffff'),
  textAlign: z.enum(['left', 'center', 'right']).optional().default('center'),
  duration: z.number().int().positive().optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validation = TextContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { name, description, content, fontSize, fontColor, textAlign, duration } = validation.data;

    // Create text content in database
    const textContent = await prisma.content.create({
      data: {
        name,
        description,
        type: ContentType.TEXT,
        duration,
        metadata: {
          content,
          fontSize,
          fontColor,
          textAlign,
        },
        createdById: user.id,
      },
    });

    return NextResponse.json(textContent);
  } catch (error) {
    console.error('Failed to create text content:', error);
    return NextResponse.json(
      { error: 'Failed to create text content' },
      { status: 500 }
    );
  }
}