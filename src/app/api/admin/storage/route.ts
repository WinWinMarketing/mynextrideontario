import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from '@/lib/config';

// Use the same config as the main S3 library
function getS3Client(): S3Client {
  return new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

// Storage limit - 2GB for a whole year of leads (generous for a small business)
const STORAGE_LIMIT_MB = 2048; // 2GB

export async function GET() {
  // Check auth
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s3 = getS3Client();
  const bucket = config.aws.bucketName;

  try {
    let totalSize = 0;
    let objectCount = 0;
    let continuationToken: string | undefined;

    // List all objects and sum their sizes
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      });

      const response = await s3.send(command);
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          totalSize += obj.Size || 0;
          objectCount++;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    const usedMB = totalSize / (1024 * 1024);
    const percent = (usedMB / STORAGE_LIMIT_MB) * 100;

    return NextResponse.json({
      used: parseFloat(usedMB.toFixed(2)),
      total: STORAGE_LIMIT_MB,
      percent: parseFloat(Math.min(percent, 100).toFixed(1)),
      bytes: totalSize,
      objectCount,
      limitMB: STORAGE_LIMIT_MB,
    });
  } catch (error) {
    console.error('Storage calculation error:', error);
    return NextResponse.json({
      used: 0,
      total: STORAGE_LIMIT_MB,
      percent: 0,
      bytes: 0,
      objectCount: 0,
      error: String(error),
    }, { status: 500 });
  }
}

