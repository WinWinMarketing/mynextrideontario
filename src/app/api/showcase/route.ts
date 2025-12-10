import { NextResponse } from 'next/server';
import { getShowcaseVehiclesWithUrls } from '@/lib/s3';

// Public endpoint - no auth required
export async function GET() {
  try {
    // Get vehicles with fresh signed URLs
    const vehicles = await getShowcaseVehiclesWithUrls();
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return NextResponse.json({ vehicles: [] });
  }
}
