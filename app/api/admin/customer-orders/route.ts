import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      conditions.push(`co.order_status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(co.customer_order_id ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await query(
      `SELECT 
        co.customer_order_id,
        co.user_id,
        u.full_name,
        u.email,
        u.phone,
        co.order_date,
        co.total_amount,
        co.shipping_address,
        co.order_status,
        co.payment_status,
        co.tracking_number,
        co.carrier,
        co.dispatched_at,
        co.updated_at,
        COUNT(coi.customer_order_item_id) as items_count
      FROM stockflow.customer_orders co
      JOIN stockflow.users u ON co.user_id = u.user_id
      LEFT JOIN stockflow.customer_order_items coi ON co.customer_order_id = coi.customer_order_id
      ${whereClause}
      GROUP BY co.customer_order_id, co.user_id, u.full_name, u.email, u.phone, co.order_date, co.total_amount, co.shipping_address, co.order_status, co.payment_status, co.tracking_number, co.carrier, co.dispatched_at, co.updated_at
      ORDER BY co.order_date DESC`,
      params
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
