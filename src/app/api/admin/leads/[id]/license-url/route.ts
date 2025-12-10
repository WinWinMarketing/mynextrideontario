import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { getDriversLicenseSignedUrl, getLeadsByMonth } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam);
    const month = parseInt(monthParam);

    // Find the lead to get the license key
    const leads = await getLeadsByMonth(year, month);
    const lead = leads.find((l) => l.id === id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.driversLicenseKey) {
      return NextResponse.json(
        { error: 'No driver license image for this lead' },
        { status: 404 }
      );
    }

    const signedUrl = await getDriversLicenseSignedUrl(lead.driversLicenseKey);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting license URL:', error);
    return NextResponse.json(
      { error: 'Failed to get license URL' },
      { status: 500 }
    );
  }
}

