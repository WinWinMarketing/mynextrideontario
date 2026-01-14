import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getEmailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/s3';

// GET - Get all email templates
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await getEmailTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, subject, body: templateBody, category } = body;

    if (!name || !subject || !templateBody || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = await addEmailTemplate({
      name,
      subject,
      body: templateBody,
      category,
    });

    return NextResponse.json({ template, success: true });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// PATCH - Update template
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, subject, body: templateBody, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const template = await updateEmailTemplate(id, {
      ...(name && { name }),
      ...(subject && { subject }),
      ...(templateBody && { body: templateBody }),
      ...(category && { category }),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found or is a default template' }, { status: 404 });
    }

    return NextResponse.json({ template, success: true });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const success = await deleteEmailTemplate(id);
    if (!success) {
      return NextResponse.json({ error: 'Template not found or is a default template' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

