import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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

export async function GET(request: NextRequest) {
  // Check auth
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  const s3 = getS3Client();
  const bucket = config.aws.bucketName;

  try {
    const allLeads: any[] = [];

    // Fetch leads from all months of the specified year
    for (let month = 1; month <= 12; month++) {
      const prefix = `leads/${year}/${String(month).padStart(2, '0')}/`;
      
      let continuationToken: string | undefined;
      
      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const listResponse = await s3.send(listCommand);
        
        if (listResponse.Contents) {
          for (const obj of listResponse.Contents) {
            if (obj.Key && obj.Key.endsWith('.json')) {
              try {
                const getCommand = new GetObjectCommand({
                  Bucket: bucket,
                  Key: obj.Key,
                });
                const getResponse = await s3.send(getCommand);
                const body = await getResponse.Body?.transformToString();
                if (body) {
                  const lead = JSON.parse(body);
                  allLeads.push(lead);
                }
              } catch (e) {
                console.error(`Error fetching ${obj.Key}:`, e);
              }
            }
          }
        }

        continuationToken = listResponse.NextContinuationToken;
      } while (continuationToken);
    }

    // Sort by date descending
    allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      leads: allLeads,
      count: allLeads.length,
      year,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed', details: String(error) }, { status: 500 });
  }
}

