import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alertId = params.id;
    
    // In production, you'd delete the alert from your database
    // For now, we'll just return success
    console.log(`Alert ${alertId} dismissed by ${user.email}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Alert dismiss error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}