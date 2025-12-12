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
                nodeCount: workflow.schema?.nodes?.length || workflow.nodes?.length || 0,
                connectionCount: workflow.schema?.edges?.length || workflow.connections?.length || 0,
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
  console.log('[WORKFLOW API] POST request received');
  
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    console.log('[WORKFLOW API] Authentication failed');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[WORKFLOW API] Authentication passed');

  try {
    const data = await request.json();
    console.log('[WORKFLOW API] Data received:', { 
      hasProfiles: !!data.profiles, 
      profileCount: data.profiles?.length || 0,
      hasActiveProfile: !!data.activeProfile,
      hasSingleProfile: !!data.profile
    });
    
    const s3 = getS3Client();
    const bucket = config.aws.bucketName;
    console.log('[WORKFLOW API] Using bucket:', bucket);
    
    // Single profile save (optimized path)
    if (data.profile && data.profile.id) {
      const profile = data.profile;
      const key = `${WORKFLOWS_PREFIX}${profile.id}.json`;
      console.log('[WORKFLOW API] Saving single profile:', key);

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(profile, null, 2),
        ContentType: 'application/json',
      }));

      // Optionally save active profile snapshot
      if (data.activeProfileId === profile.id || data.activeProfile?.id === profile.id) {
        const activeKey = `${WORKFLOWS_PREFIX}active-profile.json`;
        console.log('[WORKFLOW API] Saving active profile:', activeKey);
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: activeKey,
          Body: JSON.stringify(profile, null, 2),
          ContentType: 'application/json',
        }));
      }

      // Metadata (optional)
      if (Array.isArray(data.profileIds)) {
        const metadataKey = `${WORKFLOWS_PREFIX}metadata.json`;
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: metadataKey,
          Body: JSON.stringify({
            lastSaved: new Date().toISOString(),
            profileIds: data.profileIds,
            activeProfileId: data.activeProfileId || data.activeProfile?.id,
          }, null, 2),
          ContentType: 'application/json',
        }));
      }

      console.log('[WORKFLOW API] Successfully saved single profile');
      return NextResponse.json({ success: true, savedCount: 1, message: 'Saved profile to S3' });
    }

    // Check if this is a batch profiles save
    if (data.profiles && Array.isArray(data.profiles)) {
      let savedCount = 0;
      
      // Save all profiles
      for (const profile of data.profiles) {
        if (!profile.id) {
          console.log('[WORKFLOW API] Skipping profile without ID');
          continue;
        }
        
        const key = `${WORKFLOWS_PREFIX}${profile.id}.json`;
        console.log('[WORKFLOW API] Saving profile:', key);
        
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: JSON.stringify(profile, null, 2),
          ContentType: 'application/json',
        }));
        savedCount++;
      }
      
      // Also save the active profile separately for quick access
      if (data.activeProfile?.id) {
        const activeKey = `${WORKFLOWS_PREFIX}active-profile.json`;
        console.log('[WORKFLOW API] Saving active profile:', activeKey);
        
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: activeKey,
          Body: JSON.stringify(data.activeProfile, null, 2),
          ContentType: 'application/json',
        }));
      }
      
      // Also save metadata
      const metadataKey = `${WORKFLOWS_PREFIX}metadata.json`;
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: metadataKey,
        Body: JSON.stringify({
          lastSaved: new Date().toISOString(),
          profileIds: data.profiles.map((p: any) => p.id),
          activeProfileId: data.activeProfile?.id,
        }, null, 2),
        ContentType: 'application/json',
      }));
      
      console.log('[WORKFLOW API] Successfully saved', savedCount, 'profiles');
      return NextResponse.json({ success: true, savedCount, message: `Saved ${savedCount} profiles to S3` });
    }
    
    // Single workflow save (legacy format)
    const workflow = data;
    if (!workflow.id) {
      workflow.id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      workflow.createdAt = new Date().toISOString();
    }
    workflow.updatedAt = new Date().toISOString();

    const key = `${WORKFLOWS_PREFIX}${workflow.id}.json`;
    console.log('[WORKFLOW API] Saving single workflow:', key);
    
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(workflow, null, 2),
      ContentType: 'application/json',
    }));

    console.log('[WORKFLOW API] Successfully saved workflow');
    return NextResponse.json({ success: true, workflow });
  } catch (err: any) {
    console.error('[WORKFLOW API] Error saving workflow:', err.message || err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save workflow', 
      details: err.message || 'Unknown error' 
    }, { status: 500 });
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

