import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { displayService } from '@/lib/services/display-service';
import { validateUpdateDisplay, type UpdateDisplayInput } from '@/lib/validators/display-schemas';
import { validationErrorResponse, ErrorResponses, isValidUUID } from '@/lib/validators/api-validators';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/displays/[id] - Get single display
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid display ID format');
    }
    
    const display = await displayService.getDisplay(id);
    
    if (!display) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }

    return NextResponse.json(display);
  } catch (error) {
    console.error('Error fetching display:', error);
    return NextResponse.json(
      { error: 'Failed to fetch display' },
      { status: 500 }
    );
  }
}

// PUT /api/displays/[id] - Update display
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid display ID format');
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = validateUpdateDisplay(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }
    
    const validatedData = validation.data as UpdateDisplayInput;

    const display = await displayService.updateDisplay(id, validatedData);

    if (!display) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }

    return NextResponse.json(display);
  } catch (error) {
    console.error('Error updating display:', error);
    return NextResponse.json(
      { error: 'Failed to update display' },
      { status: 500 }
    );
  }
}

// DELETE /api/displays/[id] - Delete display
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate ID format
    if (!isValidUUID(id)) {
      return ErrorResponses.badRequest('Invalid display ID format');
    }
    
    const success = await displayService.deleteDisplay(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Display deleted successfully' });
  } catch (error) {
    console.error('Error deleting display:', error);
    return NextResponse.json(
      { error: 'Failed to delete display' },
      { status: 500 }
    );
  }
}