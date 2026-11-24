import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch fresh user profile
    const result = await query(
      `SELECT user_id, full_name, email, phone, role, account_status, created_at
       FROM stockflow.users 
       WHERE user_id = $1`,
      [session.user_id]
    );

    if (result.rows.length === 0 || result.rows[0].account_status !== 'active') {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message }, { status: 500 });
  }
}
