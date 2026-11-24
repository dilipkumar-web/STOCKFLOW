import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const poRes = await query(
      `SELECT 
        po.*,
        s.name as supplier_name,
        s.company as supplier_company,
        s.email as supplier_email,
        s.phone as supplier_phone,
        w.name as warehouse_name,
        w.location as warehouse_location
       FROM stockflow.purchase_orders po
       JOIN stockflow.suppliers s ON po.supplier_id = s.supplier_id
       JOIN stockflow.warehouses w ON po.warehouse_id = w.warehouse_id
       WHERE po.order_id = $1`,
      [params.id]
    );

    if (poRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Purchase order not found' }, { status: 404 });
    }

    const itemsRes = await query(
      `SELECT 
        oi.item_id,
        oi.product_id,
        p.name as product_name,
        p.category,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) as line_total
       FROM stockflow.order_items oi
       JOIN stockflow.products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...poRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
