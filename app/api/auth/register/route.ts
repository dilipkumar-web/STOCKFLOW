import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    const cleanPhone = phone ? String(phone).trim() : null;

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await query(
      `SELECT user_id FROM stockflow.users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Generate unique client user_id
    const userId = `USR-CLI-${Date.now().toString().slice(-6)}`;
    const passwordHash = await hashPassword(password);

    await query(
      `INSERT INTO stockflow.users (user_id, full_name, email, password_hash, phone, role, account_status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'client', 'active', CURRENT_TIMESTAMP)`,
      [userId, cleanName, cleanEmail, passwordHash, cleanPhone]
    );

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      userId,
    });
  } catch (error: any) {
    console.error('[AUTH REGISTER ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register account' },
      { status: 500 }
    );
  }
}
