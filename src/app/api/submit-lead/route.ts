import { NextRequest, NextResponse } from 'next/server';
import { leadApplicationSchema } from '@/lib/validation';
import { saveLead } from '@/lib/s3';
import { sendLeadNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dataString = formData.get('data');
    const licenseFile = formData.get('license') as File | null;

    console.log('📋 Form submission received');
    console.log('License file present:', !!licenseFile);
    if (licenseFile) {
      console.log('License file details:', {
        name: licenseFile.name,
        size: licenseFile.size,
        type: licenseFile.type,
      });
    }

    if (!dataString || typeof dataString !== 'string') {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    // Parse and validate
    const rawData = JSON.parse(dataString);
    const validationResult = leadApplicationSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const formDataValidated = validationResult.data;

    // Prepare license file
    let licenseFileData: { buffer: Buffer; filename: string; contentType: string } | undefined;
    
    if (licenseFile && licenseFile.size > 0) {
      console.log('✅ Processing license file upload...');
      const buffer = Buffer.from(await licenseFile.arrayBuffer());
      licenseFileData = {
        buffer,
        filename: licenseFile.name,
        contentType: licenseFile.type,
      };
      console.log('✅ License file ready for S3 upload');
    } else {
      console.log('ℹ️ No license file provided with this submission');
    }

    // Save lead to S3
    console.log('💾 Saving lead to S3...');
    const lead = await saveLead(formDataValidated, licenseFileData);
    console.log('✅ Lead saved successfully:', {
      id: lead.id,
      hasLicense: !!lead.driversLicenseKey,
      licenseKey: lead.driversLicenseKey,
    });

    // Auto-email disabled - admin will manually send emails from dashboard
    // Uncomment below if you want auto-notifications on new leads
    // try {
    //   console.log('📧 Attempting to send email notification...');
    //   const emailSent = await sendLeadNotificationEmail(lead);
    //   console.log(emailSent ? '✅ Email sent' : '⚠️ Email not sent');
    // } catch (emailError) {
    //   console.error('❌ Email notification failed:', emailError);
    // }

    return NextResponse.json(
      { 
        success: true, 
        leadId: lead.id,
        hasLicense: !!lead.driversLicenseKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error submitting lead:', error);
    return NextResponse.json(
      { error: 'Failed to submit application', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
