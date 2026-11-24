import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: All inventory items with product and warehouse details
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const warehouseId = url.searchParams.get('warehouseId') || '';
  const filterLowStock = url.searchParams.get('lowStock') === 'true';
  const search = url.searchParams.get('search') || '';

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (warehouseId) {
      params.push(warehouseId);
      conditions.push(`i.warehouse_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.product_id ILIKE $${params.length} OR w.name ILIKE $${params.length})`);
    }

    if (filterLowStock) {
      conditions.push(`i.quantity <= p.reorder_level`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listRes = await query(
      `SELECT 
        i.inventory_id,
        i.product_id,
        i.warehouse_id,
        i.quantity,
        i.last_updated,
        p.name as product_name,
        p.category as product_category,
        p.price as product_price,
        p.reorder_level,
        w.name as warehouse_name,
        w.location as warehouse_location,
        (i.quantity * p.price) as item_value,
        CASE 
          WHEN i.quantity = 0 THEN 'Out of Stock'
          WHEN i.quantity <= p.reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM stockflow.inventory i
      JOIN stockflow.products p ON i.product_id = p.product_id
      JOIN stockflow.warehouses w ON i.warehouse_id = w.warehouse_id
      ${whereClause}
      ORDER BY w.name ASC, p.name ASC`,
      params
    );

    // Warehouses list for filter dropdown
    const whList = await query(`SELECT warehouse_id, name, location FROM stockflow.warehouses ORDER BY name`);

    return NextResponse.json({
      success: true,
      data: listRes.rows,
      warehouses: whList.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Stock IN, Stock OUT, Stock Adjustment
export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { actionType, productId, warehouseId, quantity, remarks } = body;

    if (!actionType || !productId || !warehouseId || !quantity) {
      return NextResponse.json(
        { success: false, error: 'actionType, productId, warehouseId, and quantity are required.' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive integer.' },
        { status: 400 }
      );
    }

    // Atomic transaction
    const result = await withTransaction(async (client) => {
      // 1. Lock warehouse row and check capacity if IN
      const whCheck = await client.query(
        `SELECT capacity, 
                (SELECT COALESCE(SUM(quantity), 0) FROM stockflow.inventory WHERE warehouse_id = $1) as current_stock
         FROM stockflow.warehouses 
         WHERE warehouse_id = $1 
         FOR UPDATE`,
        [warehouseId]
      );

      if (whCheck.rows.length === 0) {
        throw new Error('Warehouse not found');
      }

      const capacity = whCheck.rows[0].capacity;
      const currentStock = parseInt(whCheck.rows[0].current_stock, 10);

      // 2. Lock inventory row if exists
      const invCheck = await client.query(
        `SELECT quantity FROM stockflow.inventory 
         WHERE product_id = $1 AND warehouse_id = $2 
         FOR UPDATE`,
        [productId, warehouseId]
      );

      const currentItemQty = invCheck.rows.length > 0 ? invCheck.rows[0].quantity : 0;

      if (actionType === 'IN') {
        if (currentStock + qty > capacity) {
          throw new Error(
            `Warehouse capacity exceeded. Available space: ${capacity - currentStock}, requested: ${qty}`
          );
        }

        // Upsert inventory
        await client.query(
          `INSERT INTO stockflow.inventory (product_id, warehouse_id, quantity, last_updated)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (product_id, warehouse_id)
           DO UPDATE SET quantity = stockflow.inventory.quantity + EXCLUDED.quantity, last_updated = CURRENT_TIMESTAMP`,
          [productId, warehouseId, qty]
        );

        // Record IN transaction
        await client.query(
          `INSERT INTO stockflow.stock_transactions (product_id, destination_warehouse, transaction_type, quantity, transaction_time, remarks)
           VALUES ($1, $2, 'IN', $3, CURRENT_TIMESTAMP, $4)`,
          [productId, warehouseId, qty, remarks || 'Manual Stock IN']
        );
      } else if (actionType === 'OUT') {
        if (currentItemQty < qty) {
          throw new Error(
            `Insufficient stock in warehouse. Available: ${currentItemQty}, requested: ${qty}`
          );
        }

        await client.query(
          `UPDATE stockflow.inventory 
           SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
           WHERE product_id = $2 AND warehouse_id = $3`,
          [qty, productId, warehouseId]
        );

        // Record OUT transaction
        await client.query(
          `INSERT INTO stockflow.stock_transactions (product_id, source_warehouse, transaction_type, quantity, transaction_time, remarks)
           VALUES ($1, $2, 'OUT', $3, CURRENT_TIMESTAMP, $4)`,
          [productId, warehouseId, qty, remarks || 'Manual Stock OUT']
        );
      } else {
        throw new Error(`Unsupported actionType: ${actionType}. Must be IN or OUT.`);
      }

      return { actionType, qty, productId, warehouseId };
    });

    return NextResponse.json({
      success: true,
      message: `Stock ${result.actionType} of ${result.qty} units recorded successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
