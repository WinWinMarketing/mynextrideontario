import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Lead, LeadStatus, DeadReason } from './validation';
import { generateId, getMonthYearKey } from './utils';

// Initialize S3 client - only on server side
function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucketName(): string {
  return process.env.LEADS_BUCKET_NAME || 'martin-leads';
}

// Save a new lead
export async function saveLead(
  formData: Lead['formData'],
  licenseFile?: { buffer: Buffer; filename: string; contentType: string }
): Promise<Lead> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const id = generateId();
  const now = new Date();
  const monthYear = getMonthYearKey(now);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  let driversLicenseKey: string | undefined;
  
  // Upload driver's license if provided
  if (licenseFile) {
    const ext = licenseFile.filename.split('.').pop() || 'jpg';
    driversLicenseKey = `drivers-licenses/${id}.${ext}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: driversLicenseKey,
      Body: licenseFile.buffer,
      ContentType: licenseFile.contentType,
    }));
  }
  
  // Create lead object
  const lead: Lead = {
    id,
    createdAt: now.toISOString(),
    monthYear,
    status: 'new',
    notes: '',
    driversLicenseKey,
    formData,
  };
  
  // Save lead JSON
  const leadKey = `leads/${year}/${month}/${now.getTime()}-${id}.json`;
  
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: leadKey,
    Body: JSON.stringify(lead, null, 2),
    ContentType: 'application/json',
  }));
  
  return lead;
}

// Get leads for a specific month
export async function getLeadsByMonth(year: number, month: number): Promise<Lead[]> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const prefix = `leads/${year}/${String(month).padStart(2, '0')}/`;
  
  try {
    const listResult = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    }));
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      return [];
    }
    
    // Fetch all lead JSON files
    const leads: Lead[] = [];
    
    for (const obj of listResult.Contents) {
      if (!obj.Key) continue;
      
      try {
        const getResult = await s3.send(new GetObjectCommand({
          Bucket: bucket,
          Key: obj.Key,
        }));
        
        const body = await getResult.Body?.transformToString();
        if (body) {
          const lead = JSON.parse(body) as Lead;
          // Store the S3 key for updates
          (lead as Lead & { _s3Key?: string })._s3Key = obj.Key;
          leads.push(lead);
        }
      } catch (err) {
        console.error(`Error fetching lead ${obj.Key}:`, err);
      }
    }
    
    // Sort by creation date, newest first
    leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return leads;
  } catch (err) {
    console.error('Error listing leads:', err);
    return [];
  }
}

// Update a lead's status, notes, or dead reason
export async function updateLead(
  leadId: string,
  year: number,
  month: number,
  updates: {
    status?: LeadStatus;
    deadReason?: DeadReason;
    notes?: string;
  }
): Promise<Lead | null> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const prefix = `leads/${year}/${String(month).padStart(2, '0')}/`;
  
  try {
    // Find the lead file
    const listResult = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    }));
    
    if (!listResult.Contents) return null;
    
    // Find the file containing this lead ID
    for (const obj of listResult.Contents) {
      if (!obj.Key || !obj.Key.includes(leadId)) continue;
      
      const getResult = await s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: obj.Key,
      }));
      
      const body = await getResult.Body?.transformToString();
      if (!body) continue;
      
      const lead = JSON.parse(body) as Lead;
      
      if (lead.id === leadId) {
        // Apply updates
        const updatedLead: Lead = {
          ...lead,
          ...updates,
        };
        
        // Save back to S3
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: obj.Key,
          Body: JSON.stringify(updatedLead, null, 2),
          ContentType: 'application/json',
        }));
        
        return updatedLead;
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error updating lead:', err);
    return null;
  }
}

// Generate a signed URL for viewing a driver's license
export async function getDriversLicenseSignedUrl(licenseKey: string): Promise<string> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: licenseKey,
  });
  
  // URL expires in 5 minutes
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  
  return signedUrl;
}

