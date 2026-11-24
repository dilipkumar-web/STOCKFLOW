import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all purchase orders with supplier and warehouse details
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
      conditions.push(`po.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(po.order_id ILIKE $${params.length} OR s.name ILIKE $${params.length} OR s.company ILIKE $${params.length} OR w.name ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listRes = await query(
      `SELECT 
        po.order_id,
        po.supplier_id,
        s.name as supplier_name,
        s.company as supplier_company,
        po.warehouse_id,
        w.name as warehouse_name,
        po.order_date,
        po.expected_delivery,
        po.received_date,
        po.status,
        COUNT(oi.item_id) as total_items,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_amount
      FROM stockflow.purchase_orders po
      JOIN stockflow.suppliers s ON po.supplier_id = s.supplier_id
      JOIN stockflow.warehouses w ON po.warehouse_id = w.warehouse_id
      LEFT JOIN stockflow.order_items oi ON po.order_id = oi.order_id
      ${whereClause}
      GROUP BY po.order_id, po.supplier_id, s.name, s.company, po.warehouse_id, w.name, po.order_date, po.expected_delivery, po.received_date, po.status
      ORDER BY po.order_date DESC`,
      params
    );

    return NextResponse.json({ success: true, data: listRes.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create purchase order with line items in single atomic transaction
export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { order_id, supplier_id, warehouse_id, expected_delivery, items } = body;

    if (!supplier_id || !warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier, warehouse, and at least one line item are required.' },
        { status: 400 }
      );
    }

    const orderId = order_id
      ? String(order_id).trim().toUpperCase()
      : `PO-${Date.now().toString().slice(-6)}`;

    await withTransaction(async (client) => {
      // 1. Insert purchase_order
      await client.query(
        `INSERT INTO stockflow.purchase_orders 
          (order_id, supplier_id, warehouse_id, order_date, expected_delivery, status)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, 'Pending')`,
        [orderId, supplier_id, warehouse_id, expected_delivery || null]
      );

      // 2. Insert order_items
      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        const price = parseFloat(item.unit_price);

        if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
          throw new Error(`Invalid quantity or unit price for product ${item.product_id}`);
        }

        await client.query(
          `INSERT INTO stockflow.order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.product_id, qty, price]
        );
      }
    });

    return NextResponse.json({
      success: true,
      message: `Purchase Order ${orderId} created successfully`,
      orderId,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'A purchase order with this Order ID already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
