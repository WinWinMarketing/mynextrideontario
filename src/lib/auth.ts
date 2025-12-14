import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { config } from './config';

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(config.admin.sessionSecret);
}

// Verify admin password and create session
export async function verifyAdminAndCreateSession(password: string): Promise<boolean> {
  if (password !== config.admin.password) {
    return false;
  }
  
  // Create JWT token
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecretKey());
  
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  
  return true;
}

// Verify admin session from cookie
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return false;
    }
    
    const { payload } = await jwtVerify(token, getSecretKey());
    
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

// Clear admin session
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Backwards-compatible auth helper for API routes that expect a `{ authenticated }` result.
// (Some routes were written against an earlier auth utility shape.)
export async function verifyAuth(_request?: NextRequest): Promise<{ authenticated: boolean }> {
  const authenticated = await verifyAdminSession();
  return { authenticated };
}
