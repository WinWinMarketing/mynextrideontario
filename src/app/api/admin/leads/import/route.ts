import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { saveLead } from '@/lib/s3';
import { LeadStatus } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leads, targetStage } = await request.json();
    
    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Invalid leads data' }, { status: 400 });
    }

    const results = {
      imported: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      try {
        // Validate required fields
        if (!lead.firstName || !lead.lastName || !lead.email || !lead.phone) {
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Build form data structure
        const formData = {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          address: lead.address || '',
          city: lead.city || '',
          province: lead.province || 'Ontario',
          postalCode: lead.postalCode || '',
          creditScore: 'not_sure' as const,
          employmentStatus: 'employed' as const,
          vehiclePreference: lead.vehicleType || 'suv',
          downPayment: lead.budget ? String(lead.budget) : '0',
          hasTradeIn: false,
        };

        // Save lead to S3
        await saveLead(formData);
        results.imported++;
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

