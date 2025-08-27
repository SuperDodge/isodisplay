import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Generate mock historical data
    // In production, this would come from your analytics database
    const data = generateMockHistoricalData(range);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Historical data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockHistoricalData(range: string) {
  const days = range === '7d' ? 7 : 30;
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic mock data with some variance
    const baseDisplayViews = 150;
    const baseContentUploads = 8;
    const basePlaylistChanges = 3;
    const baseUptime = 98;

    // Add some randomness and trends
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 0.6 : 1.0;
    
    // Business hours pattern - more activity during business days
    const businessDayBoost = isWeekend ? 0 : Math.random() * 0.4 + 0.8;
    
    data.push({
      date: date.toISOString().split('T')[0],
      displayViews: Math.floor((baseDisplayViews + Math.random() * 100 - 50) * weekendMultiplier * businessDayBoost),
      contentUploads: Math.floor((baseContentUploads + Math.random() * 6 - 3) * weekendMultiplier),
      playlistChanges: Math.floor((basePlaylistChanges + Math.random() * 4 - 2) * weekendMultiplier),
      systemUptime: Math.min(100, Math.max(85, baseUptime + Math.random() * 8 - 4))
    });
  }

  // Calculate summary statistics
  const totalViews = data.reduce((sum, d) => sum + d.displayViews, 0);
  const avgDailyUploads = Math.round(data.reduce((sum, d) => sum + d.contentUploads, 0) / data.length);
  const peakConcurrentDisplays = Math.max(...data.map(d => Math.floor(d.displayViews / 20))); // Approximate concurrent displays
  const avgSystemUptime = Math.round(data.reduce((sum, d) => sum + d.systemUptime, 0) / data.length);

  return {
    last7Days: range === '7d' ? data : data.slice(-7),
    last30Days: range === '30d' ? data : [],
    summary: {
      totalViews,
      avgDailyUploads,
      peakConcurrentDisplays,
      avgSystemUptime
    }
  };
}