import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, location, capacity } = body;

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      return NextResponse.json({ success: false, error: 'Capacity must be positive' }, { status: 400 });
    }

    const res = await query(
      `UPDATE stockflow.warehouses
       SET name = $1, location = $2, capacity = $3
       WHERE warehouse_id = $4
       RETURNING *`,
      [name.trim(), location.trim(), cap, params.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: res.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const stockCheck = await query(
      `SELECT COALESCE(SUM(quantity), 0) as total FROM stockflow.inventory WHERE warehouse_id = $1`,
      [params.id]
    );

    if (parseInt(stockCheck.rows[0]?.total || '0', 10) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete warehouse that still contains inventory. Relocate stock first.',
        },
        { status: 400 }
      );
    }

    await query(`DELETE FROM stockflow.inventory WHERE warehouse_id = $1`, [params.id]);
    const delRes = await query(`DELETE FROM stockflow.warehouses WHERE warehouse_id = $1 RETURNING warehouse_id`, [params.id]);

    if (delRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
