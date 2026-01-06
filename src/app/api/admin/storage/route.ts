import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || 'mynextrideontario-leads';
const STORAGE_LIMIT_MB = 500; // 500MB limit for the free/starter tier

export async function GET() {
  // Check auth
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let totalSize = 0;
    let continuationToken: string | undefined;

    // List all objects and sum their sizes
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken: continuationToken,
      });

      const response = await s3.send(command);
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          totalSize += obj.Size || 0;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    const usedMB = totalSize / (1024 * 1024);
    const percent = (usedMB / STORAGE_LIMIT_MB) * 100;

    return NextResponse.json({
      used: usedMB,
      total: STORAGE_LIMIT_MB,
      percent: Math.min(percent, 100),
      bytes: totalSize,
    });
  } catch (error) {
    console.error('Storage calculation error:', error);
    // Return estimated values if S3 fails
    return NextResponse.json({
      used: 0,
      total: STORAGE_LIMIT_MB,
      percent: 0,
      bytes: 0,
      error: 'Could not calculate exact storage',
    });
  }
}

