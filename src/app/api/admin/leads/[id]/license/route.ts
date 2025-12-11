import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'winwinmarketingtesting2';

// Friendly license download endpoint
// URL: /api/admin/leads/{id}/license?name=john-doe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const name = request.nextUrl.searchParams.get('name') || 'license';

    // First, we need to get the lead to find the license key
    const leadsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/leads?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`, {
      headers: { Cookie: request.headers.get('cookie') || '' },
    });

    if (!leadsRes.ok) {
      // Try to find the license key directly in S3
      // List objects in the licenses folder to find one matching the lead ID
      const licenseKey = `licenses/${id}_license.jpg`;
      
      const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: licenseKey,
      });

      try {
        const response = await s3.send(command);
        const body = await response.Body?.transformToByteArray();
        
        if (!body) {
          return NextResponse.json({ error: 'License not found' }, { status: 404 });
        }

        return new NextResponse(body, {
          headers: {
            'Content-Type': response.ContentType || 'image/jpeg',
            'Content-Disposition': `attachment; filename="${name}-license.jpg"`,
            'Cache-Control': 'private, max-age=3600',
          },
        });
      } catch (s3Error) {
        // Try without extension
        const altKey = `licenses/${id}_license`;
        try {
          const altCommand = new GetObjectCommand({
            Bucket: BUCKET,
            Key: altKey,
          });
          const altResponse = await s3.send(altCommand);
          const body = await altResponse.Body?.transformToByteArray();
          
          if (!body) {
            return NextResponse.json({ error: 'License not found' }, { status: 404 });
          }

          return new NextResponse(body, {
            headers: {
              'Content-Type': altResponse.ContentType || 'image/jpeg',
              'Content-Disposition': `attachment; filename="${name}-license.jpg"`,
              'Cache-Control': 'private, max-age=3600',
            },
          });
        } catch {
          return NextResponse.json({ error: 'License not found' }, { status: 404 });
        }
      }
    }

    return NextResponse.json({ error: 'Unable to fetch license' }, { status: 500 });
  } catch (error) {
    console.error('License proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

