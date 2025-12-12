import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyAuth } from '@/lib/auth';
import { config } from '@/lib/config';

const WORKFLOWS_PREFIX = 'workflows/';

function getS3Client(): S3Client {
  return new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

// GET - List all workflows or get specific workflow
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get('id');

  const s3 = getS3Client();
  const bucket = config.aws.bucketName;

  try {
    if (workflowId) {
      // Get specific workflow
      const result = await s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: `${WORKFLOWS_PREFIX}${workflowId}.json`,
      }));
      
      const body = await result.Body?.transformToString();
      if (body) {
        return NextResponse.json(JSON.parse(body));
      }
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    } else {
      // List all workflows
      const listResult = await s3.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: WORKFLOWS_PREFIX,
      }));

      const workflows = [];
      if (listResult.Contents) {
        for (const obj of listResult.Contents) {
          if (!obj.Key || !obj.Key.endsWith('.json')) continue;
          
          try {
            const getResult = await s3.send(new GetObjectCommand({
              Bucket: bucket,
              Key: obj.Key,
            }));
            
            const body = await getResult.Body?.transformToString();
            if (body) {
              const workflow = JSON.parse(body);
              workflows.push({
                id: workflow.id,
                name: workflow.name,
                description: workflow.description,
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt,
                nodeCount: workflow.nodes?.length || 0,
                connectionCount: workflow.connections?.length || 0,
              });
            }
          } catch (err) {
            console.error(`Error fetching workflow ${obj.Key}:`, err);
          }
        }
      }

      workflows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return NextResponse.json({ workflows });
    }
  } catch (err) {
    console.error('Error fetching workflows:', err);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

// POST - Create or update workflow (supports single workflow or batch profiles)
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const s3 = getS3Client();
    const bucket = config.aws.bucketName;
    
    // Check if this is a batch profiles save
    if (data.profiles && Array.isArray(data.profiles)) {
      // Save all profiles
      for (const profile of data.profiles) {
        if (!profile.id) continue;
        
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: `${WORKFLOWS_PREFIX}${profile.id}.json`,
          Body: JSON.stringify(profile, null, 2),
          ContentType: 'application/json',
        }));
      }
      
      // Also save the active profile separately for quick access
      if (data.activeProfile) {
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: `${WORKFLOWS_PREFIX}active-profile.json`,
          Body: JSON.stringify(data.activeProfile, null, 2),
          ContentType: 'application/json',
        }));
      }
      
      return NextResponse.json({ success: true, savedCount: data.profiles.length });
    }
    
    // Single workflow save (legacy format)
    const workflow = data;
    if (!workflow.id) {
      workflow.id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      workflow.createdAt = new Date().toISOString();
    }
    workflow.updatedAt = new Date().toISOString();

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${WORKFLOWS_PREFIX}${workflow.id}.json`,
      Body: JSON.stringify(workflow, null, 2),
      ContentType: 'application/json',
    }));

    return NextResponse.json({ success: true, workflow });
  } catch (err) {
    console.error('Error saving workflow:', err);
    return NextResponse.json({ error: 'Failed to save workflow' }, { status: 500 });
  }
}

// DELETE - Delete workflow
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get('id');

  if (!workflowId) {
    return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
  }

  const s3 = getS3Client();
  const bucket = config.aws.bucketName;

  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: `${WORKFLOWS_PREFIX}${workflowId}.json`,
    }));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting workflow:', err);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}

