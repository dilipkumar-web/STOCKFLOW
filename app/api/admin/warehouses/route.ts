import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all warehouses with utilization metrics
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const res = await query(`
      SELECT 
        w.warehouse_id,
        w.name,
        w.location,
        w.capacity,
        COALESCE(SUM(i.quantity), 0) as current_stock,
        GREATEST(0, w.capacity - COALESCE(SUM(i.quantity), 0)) as available_capacity,
        ROUND((COALESCE(SUM(i.quantity), 0)::numeric / NULLIF(w.capacity, 0)) * 100, 1) as utilization_percent,
        COUNT(DISTINCT i.product_id) as products_count
      FROM stockflow.warehouses w
      LEFT JOIN stockflow.inventory i ON w.warehouse_id = i.warehouse_id
      GROUP BY w.warehouse_id, w.name, w.location, w.capacity
      ORDER BY w.name ASC
    `);

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add new warehouse
export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { warehouse_id, name, location, capacity } = body;

    if (!name || !location || !capacity) {
      return NextResponse.json(
        { success: false, error: 'Warehouse name, location, and capacity are required.' },
        { status: 400 }
      );
    }

    const whId = warehouse_id
      ? String(warehouse_id).trim().toUpperCase()
      : `WH-${Date.now().toString().slice(-4)}`;

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      return NextResponse.json(
        { success: false, error: 'Capacity must be a positive integer.' },
        { status: 400 }
      );
    }

    const insertRes = await query(
      `INSERT INTO stockflow.warehouses (warehouse_id, name, location, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [whId, name.trim(), location.trim(), cap]
    );

    return NextResponse.json({
      success: true,
      message: 'Warehouse created successfully',
      data: insertRes.rows[0],
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'A warehouse with this ID already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
