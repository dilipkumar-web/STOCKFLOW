import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const ordersRes = await query(
      `SELECT 
        co.customer_order_id,
        co.order_date,
        co.total_amount,
        co.shipping_address,
        co.order_status,
        co.payment_status,
        co.tracking_number,
        co.carrier,
        co.dispatched_at,
        co.updated_at
       FROM stockflow.customer_orders co
       WHERE co.user_id = $1
       ORDER BY co.order_date DESC`,
      [user!.user_id]
    );

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      ordersRes.rows.map(async (order) => {
        const itemsRes = await query(
          `SELECT 
            coi.customer_order_item_id,
            coi.product_id,
            coi.quantity,
            coi.unit_price,
            coi.line_total,
            p.name as product_name,
            p.category
           FROM stockflow.customer_order_items coi
           JOIN stockflow.products p ON coi.product_id = p.product_id
           WHERE coi.customer_order_id = $1`,
          [order.customer_order_id]
        );
        return {
          ...order,
          items: itemsRes.rows,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
