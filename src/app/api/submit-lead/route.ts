import { NextRequest, NextResponse } from 'next/server';
import { leadApplicationSchema } from '@/lib/validation';
import { saveLead } from '@/lib/s3';
import { sendLeadNotificationEmail } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`lead:${clientIP}`, rateLimiters.leadSubmission);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: `Please wait ${rateLimit.retryAfter} seconds before submitting again.`
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          }
        }
      );
    }

    // Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error('Failed to parse form data:', e);
      return NextResponse.json({ error: 'Invalid form submission' }, { status: 400 });
    }

    const dataString = formData.get('data');
    const licenseFile = formData.get('license') as File | null;

    if (!dataString || typeof dataString !== 'string') {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 });
    }

    // Parse JSON data
    let rawData: unknown;
    try {
      rawData = JSON.parse(dataString);
    } catch (e) {
      console.error('Failed to parse JSON data:', e);
      return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
    }

    // Validate with Zod schema
    const validationResult = leadApplicationSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      console.error('Validation errors:', errors);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: errors,
          message: Object.values(errors.fieldErrors).flat().join(', ') || 'Please check your form inputs'
        },
        { status: 400 }
      );
    }

    const formDataValidated = validationResult.data;

    // Process license file if provided
    let licenseFileData: { buffer: Buffer; filename: string; contentType: string } | undefined;
    
    if (licenseFile && licenseFile.size > 0) {
      try {
        const buffer = Buffer.from(await licenseFile.arrayBuffer());
        licenseFileData = {
          buffer,
          filename: licenseFile.name || 'license.jpg',
          contentType: licenseFile.type || 'image/jpeg',
        };
      } catch (e) {
        console.error('Failed to process license file:', e);
        // Continue without license - don't fail the submission
      }
    }

    // Save lead to S3
    const lead = await saveLead(formDataValidated, licenseFileData);

    // Send admin notification email (non-blocking)
    sendLeadNotificationEmail(lead).catch(err => {
      console.error('Failed to send notification email:', err);
    });

    return NextResponse.json(
      { 
        success: true, 
        leadId: lead.id,
        hasLicense: !!lead.driversLicenseKey,
        message: 'Application submitted successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting lead:', error);
    
    // Determine if it's an AWS error
    const isAwsError = error instanceof Error && 
      (error.message.includes('AWS') || error.message.includes('S3') || error.message.includes('credentials'));
    
    return NextResponse.json(
      { 
        error: 'Failed to submit application', 
        details: error instanceof Error ? error.message : 'Unknown error',
        message: isAwsError 
          ? 'Service temporarily unavailable. Please try again later.' 
          : 'Something went wrong. Please try again.'
      },
      { status: 500 }
    );
  }
}
