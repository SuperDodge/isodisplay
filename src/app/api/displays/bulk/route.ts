import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { displayService } from '@/lib/services/display-service';

// POST /api/displays/bulk - Create multiple displays
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { count, prefix, settings } = body;

    if (!count || count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (!prefix) {
      return NextResponse.json(
        { error: 'Prefix is required' },
        { status: 400 }
      );
    }

    const displays = await displayService.bulkCreateDisplays(
      count,
      prefix,
      settings || {},
      user.id
    );

    return NextResponse.json({
      message: `Successfully created ${displays.length} displays`,
      displays,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating bulk displays:', error);
    return NextResponse.json(
      { error: 'Failed to create displays' },
      { status: 500 }
    );
  }
}