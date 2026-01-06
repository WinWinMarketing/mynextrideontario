import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || 'mynextrideontario-leads';

export async function DELETE(request: NextRequest) {
  // Check auth
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');

  if (!year) {
    return NextResponse.json({ error: 'Year is required' }, { status: 400 });
  }

  // Prevent deletion of current year data
  const currentYear = new Date().getFullYear();
  if (parseInt(year) >= currentYear) {
    return NextResponse.json({ 
      error: 'Cannot delete current or future year data' 
    }, { status: 400 });
  }

  try {
    let totalDeleted = 0;
    const prefix = `leads/${year}/`;

    let continuationToken: string | undefined;
    
    do {
      // List objects to delete
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const listResponse = await s3.send(listCommand);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete objects in batches of 1000 (S3 limit)
        const objectsToDelete = listResponse.Contents
          .filter(obj => obj.Key)
          .map(obj => ({ Key: obj.Key! }));

        if (objectsToDelete.length > 0) {
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: {
              Objects: objectsToDelete,
              Quiet: true,
            },
          });

          await s3.send(deleteCommand);
          totalDeleted += objectsToDelete.length;
        }
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      year,
      message: `Deleted ${totalDeleted} files from ${year}`,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

