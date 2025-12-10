import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Lead, LeadStatus, DeadReason, ShowcaseVehicle, MAX_SHOWCASE_VEHICLES } from './validation';
import { generateId, getMonthYearKey } from './utils';
import { config, SETTINGS_KEY, EmailSettings, defaultEmailSettings } from './config';

// Initialize S3 client with environment variables
function getS3Client(): S3Client {
  return new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

function getBucketName(): string {
  return config.aws.bucketName;
}

// Get email settings from S3
export async function getEmailSettings(): Promise<EmailSettings> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  
  try {
    const result = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: SETTINGS_KEY,
    }));
    
    const body = await result.Body?.transformToString();
    if (body) {
      return JSON.parse(body) as EmailSettings;
    }
  } catch {
    // Settings don't exist yet, return defaults
    console.log('No email settings found, using defaults');
  }
  
  return defaultEmailSettings;
}

// Save email settings to S3
export async function saveEmailSettings(settings: EmailSettings): Promise<void> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: SETTINGS_KEY,
    Body: JSON.stringify(settings, null, 2),
    ContentType: 'application/json',
  }));
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
    console.log('📤 Uploading driver license to S3...');
    const ext = licenseFile.filename.split('.').pop() || 'jpg';
    driversLicenseKey = `drivers-licenses/${id}.${ext}`;
    
    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: driversLicenseKey,
        Body: licenseFile.buffer,
        ContentType: licenseFile.contentType,
      }));
      console.log('✅ License uploaded successfully to:', driversLicenseKey);
    } catch (err) {
      console.error('❌ Failed to upload license to S3:', err);
      throw err;
    }
  } else {
    console.log('ℹ️ No license file to upload for this lead');
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
  
  console.log('💾 Saving lead JSON:', {
    id: lead.id,
    hasLicense: !!lead.driversLicenseKey,
    licenseKey: lead.driversLicenseKey,
  });
  
  // Save lead JSON
  const leadKey = `leads/${year}/${month}/${now.getTime()}-${id}.json`;
  
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: leadKey,
      Body: JSON.stringify(lead, null, 2),
      ContentType: 'application/json',
    }));
    console.log('✅ Lead JSON saved successfully to:', leadKey);
  } catch (err) {
    console.error('❌ Failed to save lead JSON:', err);
    throw err;
  }
  
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

// ============ SHOWCASE VEHICLES ============

const SHOWCASE_KEY = 'showcase/vehicles.json';

// Get all showcase vehicles
export async function getShowcaseVehicles(): Promise<ShowcaseVehicle[]> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  
  try {
    const result = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: SHOWCASE_KEY,
    }));
    
    const body = await result.Body?.transformToString();
    if (body) {
      return JSON.parse(body) as ShowcaseVehicle[];
    }
  } catch {
    console.log('No showcase vehicles found');
  }
  
  return [];
}

// Save showcase vehicles
export async function saveShowcaseVehicles(vehicles: ShowcaseVehicle[]): Promise<void> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  
  // Limit to max vehicles
  const limitedVehicles = vehicles.slice(0, MAX_SHOWCASE_VEHICLES);
  
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: SHOWCASE_KEY,
    Body: JSON.stringify(limitedVehicles, null, 2),
    ContentType: 'application/json',
  }));
}

// Add a showcase vehicle
export async function addShowcaseVehicle(
  vehicle: Omit<ShowcaseVehicle, 'id' | 'createdAt'>,
  imageFile?: { buffer: Buffer; filename: string; contentType: string }
): Promise<ShowcaseVehicle | null> {
  const vehicles = await getShowcaseVehicles();
  
  if (vehicles.length >= MAX_SHOWCASE_VEHICLES) {
    return null;
  }
  
  const s3 = getS3Client();
  const bucket = getBucketName();
  const id = generateId();
  
  let imageKey: string | undefined;
  
  // Upload image if provided
  if (imageFile) {
    const ext = imageFile.filename.split('.').pop() || 'jpg';
    imageKey = `showcase-images/${id}.${ext}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: imageKey,
      Body: imageFile.buffer,
      ContentType: imageFile.contentType,
    }));
  }
  
  const newVehicle: ShowcaseVehicle = {
    ...vehicle,
    id,
    imageKey,
    createdAt: new Date().toISOString(),
  };
  
  vehicles.unshift(newVehicle);
  await saveShowcaseVehicles(vehicles);
  
  return newVehicle;
}

// Get showcase vehicles with fresh signed URLs
export async function getShowcaseVehiclesWithUrls(): Promise<ShowcaseVehicle[]> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const vehicles = await getShowcaseVehicles();
  
  // Generate fresh signed URLs for each vehicle's image
  const vehiclesWithUrls = await Promise.all(
    vehicles.map(async (vehicle) => {
      if (vehicle.imageKey) {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: vehicle.imageKey,
        });
        // 1 hour expiry for public showcase
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return { ...vehicle, imageUrl: signedUrl };
      }
      return vehicle;
    })
  );
  
  return vehiclesWithUrls;
}

// Delete a showcase vehicle
export async function deleteShowcaseVehicle(vehicleId: string): Promise<boolean> {
  const vehicles = await getShowcaseVehicles();
  const index = vehicles.findIndex(v => v.id === vehicleId);
  
  if (index === -1) return false;
  
  // Remove from array
  vehicles.splice(index, 1);
  await saveShowcaseVehicles(vehicles);
  
  return true;
}

// Get signed URL for showcase image
export async function getShowcaseImageSignedUrl(imageKey: string): Promise<string> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: imageKey,
  });
  
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}
