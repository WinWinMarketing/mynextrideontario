import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAndCreateSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    let password: string | null = null;

    // Try JSON first
    try {
      const json = await request.json();
      password = json?.password ?? null;
    } catch {
      // ignore JSON parse errors
    }

    // Fallback to form data if JSON missing/empty
    if (!password) {
      try {
        const form = await request.formData();
        const maybe = form.get('password');
        if (typeof maybe === 'string') password = maybe;
      } catch {
        // ignore
      }
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const success = await verifyAdminAndCreateSession(password);

    if (!success) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}


