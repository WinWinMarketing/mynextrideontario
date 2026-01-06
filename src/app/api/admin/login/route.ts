import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAndCreateSession } from '@/lib/auth';
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for brute force protection
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`login:${clientIP}`, rateLimiters.adminLogin);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts',
          message: `Please wait ${Math.ceil((rateLimit.retryAfter || 900) / 60)} minutes before trying again.`
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 900),
          }
        }
      );
    }

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
      // Don't give hints about what failed
      return NextResponse.json(
        { error: 'Invalid credentials' },
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


