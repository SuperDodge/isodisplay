import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { displayService } from '@/lib/services/display-service';
import { databaseToApiDisplay } from '@/lib/transformers/api-transformers';
import { 
  validateCreateDisplay, 
  validateDisplayQuery,
  type CreateDisplayInput 
} from '@/lib/validators/display-schemas';
import { validationErrorResponse, ErrorResponses } from '@/lib/validators/api-validators';

// GET /api/displays - Get all displays
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = validateDisplayQuery(searchParams);
    
    if (!queryValidation.success) {
      return validationErrorResponse(queryValidation.error);
    }
    
    const { includeInactive } = queryValidation.data;

    const displays = await displayService.getAllDisplays(includeInactive);

    // The display service returns frontend Display type, but we should
    // fetch raw database data and transform it for API consistency
    // For now, we'll pass through as is since displayService formats it
    return NextResponse.json(displays);
  } catch (error) {
    console.error('Error fetching displays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch displays' },
      { status: 500 }
    );
  }
}

// POST /api/displays - Create new display
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = validateCreateDisplay(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }
    
    const validatedData = validation.data as CreateDisplayInput;

    const display = await displayService.createDisplay({
      ...validatedData,
      createdBy: user.id,
    });

    // The display service returns frontend Display type
    // For consistency, we could refactor to use transformers later
    return NextResponse.json(display, { status: 201 });
  } catch (error) {
    console.error('Error creating display:', error);
    return NextResponse.json(
      { error: 'Failed to create display' },
      { status: 500 }
    );
  }
}