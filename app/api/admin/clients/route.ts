import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';

  try {
    const params: any[] = [];
    let whereClause = `WHERE u.role = 'client'`;

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1 OR u.user_id ILIKE $1)`;
    }

    const res = await query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.account_status,
        u.created_at,
        COUNT(co.customer_order_id) as total_orders,
        COALESCE(SUM(co.total_amount), 0) as total_spent
      FROM stockflow.users u
      LEFT JOIN stockflow.customer_orders co ON u.user_id = co.user_id
      ${whereClause}
      GROUP BY u.user_id, u.full_name, u.email, u.phone, u.role, u.account_status, u.created_at
      ORDER BY u.created_at DESC`,
      params
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { userId, accountStatus } = body;

    if (!userId || !['active', 'inactive'].includes(accountStatus)) {
      return NextResponse.json({ success: false, error: 'Valid userId and accountStatus required' }, { status: 400 });
    }

    const res = await query(
      `UPDATE stockflow.users 
       SET account_status = $1 
       WHERE user_id = $2 AND role = 'client'
       RETURNING user_id, full_name, email, account_status`,
      [accountStatus, userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Client account not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Account status updated to ${accountStatus}`,
      data: res.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
