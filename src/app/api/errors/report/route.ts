import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { errors } = await request.json();

    if (!Array.isArray(errors) || errors.length === 0) {
      return NextResponse.json(
        { error: 'Invalid error reports' },
        { status: 400 }
      );
    }

    // Store errors in the database
    const errorRecords = await Promise.all(
      errors.map(async (error) => {
        try {
          // Check if display exists
          const display = await prisma.display.findUnique({
            where: { id: error.displayId }
          });

          if (!display) {
            console.error(`Display not found: ${error.displayId}`);
            return null;
          }

          // Create error log entry
          return await prisma.errorLog.create({
            data: {
              displayId: error.displayId,
              errorType: error.errorType,
              message: error.message,
              stack: error.stack,
              metadata: error.metadata ? JSON.stringify(error.metadata) : null,
              userAgent: error.userAgent,
              url: error.url,
              timestamp: new Date(error.timestamp)
            }
          });
        } catch (dbError) {
          console.error('Failed to save error log:', dbError);
          return null;
        }
      })
    );

    const savedCount = errorRecords.filter(Boolean).length;

    // Log critical errors to console for monitoring
    errors.forEach(error => {
      if (error.errorType === 'system' || error.errorType === 'player') {
        console.error(`[${error.errorType.toUpperCase()} ERROR] Display ${error.displayId}: ${error.message}`);
        if (error.stack) {
          console.error(error.stack);
        }
      }
    });

    return NextResponse.json({
      success: true,
      saved: savedCount,
      total: errors.length
    });
  } catch (error) {
    console.error('Error processing error reports:', error);
    return NextResponse.json(
      { error: 'Failed to process error reports' },
      { status: 500 }
    );
  }
}

// Get error logs for a display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const displayId = searchParams.get('displayId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const errorType = searchParams.get('errorType');

    const where: any = {};
    if (displayId) where.displayId = displayId;
    if (errorType) where.errorType = errorType;

    const errors = await prisma.errorLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        display: {
          select: {
            name: true,
            location: true
          }
        }
      }
    });

    // Parse metadata back to JSON
    const formattedErrors = errors.map(error => ({
      ...error,
      metadata: error.metadata ? JSON.parse(error.metadata) : null
    }));

    return NextResponse.json(formattedErrors);
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}