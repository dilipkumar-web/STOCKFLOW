import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, hashPassword, comparePassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const res = await query(
      `SELECT user_id, full_name, email, phone, role, account_status, created_at
       FROM stockflow.users
       WHERE user_id = $1`,
      [user!.user_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { fullName, phone, currentPassword, newPassword } = body;

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'Full name cannot be empty' }, { status: 400 });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'Current password is required to set a new password' }, { status: 400 });
      }

      const userRow = await query(`SELECT password_hash FROM stockflow.users WHERE user_id = $1`, [user!.user_id]);
      const valid = await comparePassword(currentPassword, userRow.rows[0].password_hash);
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const newHash = await hashPassword(newPassword);
      await query(
        `UPDATE stockflow.users 
         SET full_name = $1, phone = $2, password_hash = $3 
         WHERE user_id = $4`,
        [fullName.trim(), phone ? phone.trim() : null, newHash, user!.user_id]
      );
    } else {
      await query(
        `UPDATE stockflow.users 
         SET full_name = $1, phone = $2 
         WHERE user_id = $3`,
        [fullName.trim(), phone ? phone.trim() : null, user!.user_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
