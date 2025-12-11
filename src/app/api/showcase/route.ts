import { NextResponse } from 'next/server';
import { getShowcaseVehiclesWithUrls, getShowcaseSettings } from '@/lib/s3';

// Public endpoint - no auth required
export async function GET() {
  try {
    // Check if showcase is enabled
    const settings = await getShowcaseSettings();
    
    if (!settings.enabled) {
      return NextResponse.json({ vehicles: [], enabled: false });
    }
    
    // Get vehicles with fresh signed URLs
    const vehicles = await getShowcaseVehiclesWithUrls();
    return NextResponse.json({ vehicles, enabled: true });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return NextResponse.json({ vehicles: [], enabled: false });
  }
}
