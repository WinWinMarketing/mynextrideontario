import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { getDriversLicenseSignedUrl } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      console.log('❌ Unauthorized license URL request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      console.log('❌ No license key provided in request');
      return NextResponse.json({ error: 'License key required' }, { status: 400 });
    }

    console.log('🔐 Generating signed URL for license:', key);
    
    try {
      const url = await getDriversLicenseSignedUrl(key);
      console.log('✅ Signed URL generated successfully');
      
      return NextResponse.json({ url });
    } catch (s3Error) {
      console.error('❌ S3 error generating signed URL:', s3Error);
      return NextResponse.json(
        { error: 'License file not found in S3' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('❌ Error in license-url route:', error);
    return NextResponse.json(
      { error: 'Failed to generate URL' },
      { status: 500 }
    );
  }
}
