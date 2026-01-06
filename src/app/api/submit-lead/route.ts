import { NextRequest, NextResponse } from 'next/server';
import { leadApplicationSchema } from '@/lib/validation';
import { saveLead } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dataString = formData.get('data');
    const licenseFile = formData.get('license') as File | null;

    if (!dataString || typeof dataString !== 'string') {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const rawData = JSON.parse(dataString);
    const validationResult = leadApplicationSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const formDataValidated = validationResult.data;

    let licenseFileData: { buffer: Buffer; filename: string; contentType: string } | undefined;
    
    if (licenseFile && licenseFile.size > 0) {
      const buffer = Buffer.from(await licenseFile.arrayBuffer());
      licenseFileData = {
        buffer,
        filename: licenseFile.name,
        contentType: licenseFile.type,
      };
    }

    const lead = await saveLead(formDataValidated, licenseFileData);

    return NextResponse.json(
      { 
        success: true, 
        leadId: lead.id,
        hasLicense: !!lead.driversLicenseKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting lead:', error);
    return NextResponse.json(
      { error: 'Failed to submit application', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
