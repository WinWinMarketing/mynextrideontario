import { NextRequest, NextResponse } from 'next/server';
import { leadApplicationSchema } from '@/lib/validation';
import { saveLead } from '@/lib/s3';
import { sendLeadNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dataString = formData.get('data');
    const licenseFile = formData.get('license') as File | null;

    if (!dataString || typeof dataString !== 'string') {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    // Parse and validate form data
    const rawData = JSON.parse(dataString);
    const validationResult = leadApplicationSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const formDataValidated = validationResult.data;

    // Prepare license file if provided
    let licenseFileData: { buffer: Buffer; filename: string; contentType: string } | undefined;
    
    if (licenseFile && licenseFile.size > 0) {
      const buffer = Buffer.from(await licenseFile.arrayBuffer());
      licenseFileData = {
        buffer,
        filename: licenseFile.name,
        contentType: licenseFile.type,
      };
    }

    // Save lead to S3
    const lead = await saveLead(formDataValidated, licenseFileData);

    // Send email notification (don't fail if email fails)
    try {
      await sendLeadNotificationEmail(lead);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue - lead is saved, email failure shouldn't block success
    }

    return NextResponse.json(
      { success: true, leadId: lead.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting lead:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

