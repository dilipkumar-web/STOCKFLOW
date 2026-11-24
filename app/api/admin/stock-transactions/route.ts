import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || '';
  const search = url.searchParams.get('search') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (type) {
      params.push(type.toUpperCase());
      conditions.push(`t.transaction_type = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.product_id ILIKE $${params.length} OR t.remarks ILIKE $${params.length})`);
    }

    if (startDate) {
      params.push(startDate);
      conditions.push(`t.transaction_time >= $${params.length}::timestamptz`);
    }

    if (endDate) {
      params.push(`${endDate} 23:59:59`);
      conditions.push(`t.transaction_time <= $${params.length}::timestamptz`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await query(
      `SELECT 
        t.transaction_id,
        t.product_id,
        p.name as product_name,
        p.category as product_category,
        t.source_warehouse,
        sw.name as source_warehouse_name,
        t.destination_warehouse,
        dw.name as destination_warehouse_name,
        t.transaction_type,
        t.quantity,
        t.transaction_time,
        t.remarks
      FROM stockflow.stock_transactions t
      LEFT JOIN stockflow.products p ON t.product_id = p.product_id
      LEFT JOIN stockflow.warehouses sw ON t.source_warehouse = sw.warehouse_id
      LEFT JOIN stockflow.warehouses dw ON t.destination_warehouse = dw.warehouse_id
      ${whereClause}
      ORDER BY t.transaction_time DESC
      LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
