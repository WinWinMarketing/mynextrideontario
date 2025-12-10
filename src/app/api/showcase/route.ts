import { NextResponse } from 'next/server';
import { getShowcaseVehicles } from '@/lib/s3';

// Public endpoint - no auth required
export async function GET() {
  try {
    const vehicles = await getShowcaseVehicles();
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return NextResponse.json({ vehicles: [] });
  }
}

