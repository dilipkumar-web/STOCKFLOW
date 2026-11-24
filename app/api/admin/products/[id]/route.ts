import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET single product with warehouse inventory breakdown
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const prodRes = await query(
      `SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock
       FROM stockflow.products p
       LEFT JOIN stockflow.inventory i ON p.product_id = i.product_id
       WHERE p.product_id = $1
       GROUP BY p.product_id`,
      [params.id]
    );

    if (prodRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const warehouseStock = await query(
      `SELECT i.quantity, i.last_updated, w.warehouse_id, w.name as warehouse_name, w.location
       FROM stockflow.inventory i
       JOIN stockflow.warehouses w ON i.warehouse_id = w.warehouse_id
       WHERE i.product_id = $1
       ORDER BY w.name`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...prodRes.rows[0],
        warehouses: warehouseStock.rows,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update product
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, category, price, reorder_level } = body;

    const res = await query(
      `UPDATE stockflow.products
       SET name = $1, category = $2, price = $3, reorder_level = $4
       WHERE product_id = $5
       RETURNING *`,
      [name.trim(), category.trim(), parseFloat(price), parseInt(reorder_level, 10), params.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: res.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete product if no foreign key constraints violate
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    // Check if stock exists
    const stockCheck = await query(
      `SELECT COALESCE(SUM(quantity), 0) as total FROM stockflow.inventory WHERE product_id = $1`,
      [params.id]
    );

    if (parseInt(stockCheck.rows[0]?.total || '0', 10) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product with existing stock in warehouses. Reduce stock to 0 first.',
        },
        { status: 400 }
      );
    }

    // Check purchase order history
    const poCheck = await query(
      `SELECT COUNT(*) as count FROM stockflow.order_items WHERE product_id = $1`,
      [params.id]
    );
    if (parseInt(poCheck.rows[0]?.count || '0', 10) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product referenced in historical purchase orders. Referential integrity enforced.',
        },
        { status: 400 }
      );
    }

    // Delete zero inventory records
    await query(`DELETE FROM stockflow.inventory WHERE product_id = $1 AND quantity = 0`, [params.id]);

    const delRes = await query(`DELETE FROM stockflow.products WHERE product_id = $1 RETURNING product_id`, [params.id]);

    if (delRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Product ${params.id} deleted successfully`,
    });
  } catch (error: any) {
    if (error?.code === '23503') {
      return NextResponse.json(
        {
          success: false,
          error: 'Referential integrity constraint: Product is linked to existing transactions or orders.',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
