import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { getLeadsByMonth, updateLead } from '@/lib/s3';
import { LeadStatus, DeadReason } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

    const leads = await getLeadsByMonth(year, month);

    return NextResponse.json({ leads, year, month });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, year, month, status, deadReason, notes } = body;

    if (!leadId || !year || !month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updates: {
      status?: LeadStatus;
      deadReason?: DeadReason;
      notes?: string;
    } = {};

    if (status !== undefined) updates.status = status;
    if (deadReason !== undefined) updates.deadReason = deadReason;
    if (notes !== undefined) updates.notes = notes;

    const updatedLead = await updateLead(leadId, year, month, updates);

    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}


