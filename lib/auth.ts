// ==============================================================================
// STOCKFLOW - Authentication & Session Management
// JWT Tokens, HTTP-only Secure Cookies, Password Hashing, Rate Limiting
// ==============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SessionUser, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'stockflow_fallback_jwt_secret_key_change_in_production_32char';
export const SESSION_COOKIE_NAME = 'stockflow_session';
const SESSION_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ------------------------------------------------------------------------------
// Password Hashing
// ------------------------------------------------------------------------------

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// ------------------------------------------------------------------------------
// JWT Session Tokens
// ------------------------------------------------------------------------------

export function signSessionToken(user: SessionUser): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.user_id || !decoded.role) {
      return null;
    }
    return {
      user_id: decoded.user_id,
      full_name: decoded.full_name || '',
      email: decoded.email,
      role: decoded.role as UserRole,
    };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------
// Cookie Operations (Next.js App Router)
// ------------------------------------------------------------------------------

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      try {
        const headerList = headers();
        const authHeader = headerList.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        }
      } catch (_) {}
    }
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export function attachSessionCookie(response: NextResponse, user: SessionUser): NextResponse {
  const token = signSessionToken(user);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.VERCEL === '1',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRATION_SECONDS,
    path: '/',
  });
  return response;
}

export function removeSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.VERCEL === '1',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

// ------------------------------------------------------------------------------
// Route Authorization Helper
// ------------------------------------------------------------------------------

export async function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: SessionUser | null; errorResponse: NextResponse | null }> {
  // Check cookie or Bearer authorization header
  let token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  const user = verifySessionToken(token);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or expired session token' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Access restricted to ${allowedRoles.join(', ')} users`,
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

// ------------------------------------------------------------------------------
// In-Memory Rate Limiting for Auth Endpoints
// ------------------------------------------------------------------------------

interface RateLimitRecord {
  attempts: number;
  lockUntil: number | null;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function checkRateLimit(key: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return { allowed: true };
  }

  if (record.lockUntil && record.lockUntil > now) {
    const remainingMinutes = Math.ceil((record.lockUntil - now) / 60000);
    return { allowed: false, waitMinutes: remainingMinutes };
  }

  if (record.lockUntil && record.lockUntil <= now) {
    rateLimitStore.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { attempts: 0, lockUntil: null };

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_MINUTES * 60 * 1000;
  }

  rateLimitStore.set(key, record);
}

export function resetLoginAttempts(key: string): void {
  rateLimitStore.delete(key);
}
