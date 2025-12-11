import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { getDriversLicenseSignedUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const name = searchParams.get('name') || 'license';

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  try {
    const signedUrl = await getDriversLicenseSignedUrl(key);
    const fileRes = await fetch(signedUrl);
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await fileRes.arrayBuffer();

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${name}-license"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('License proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch license' }, { status: 500 });
  }
}

