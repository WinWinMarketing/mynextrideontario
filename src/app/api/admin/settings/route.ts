import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { getEmailSettings, saveEmailSettings } from '@/lib/s3';
import { EmailSettings } from '@/lib/config';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getEmailSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientEmail, fromName, enabled } = body;

    const settings: EmailSettings = {
      recipientEmail: recipientEmail || '',
      fromName: fromName || 'My Next Ride Ontario',
      enabled: enabled !== false,
    };

    await saveEmailSettings(settings);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
