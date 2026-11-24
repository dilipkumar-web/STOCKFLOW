import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { productId, sourceWarehouse, destinationWarehouse, quantity, remarks } = body;

    if (!productId || !sourceWarehouse || !destinationWarehouse || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Product, source warehouse, destination warehouse, and quantity are required.' },
        { status: 400 }
      );
    }

    if (sourceWarehouse === destinationWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Source and destination warehouses must be different.' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity must be a positive integer.' }, { status: 400 });
    }

    await withTransaction(async (client) => {
      // 1. Lock and check source inventory
      const srcInv = await client.query(
        `SELECT quantity FROM stockflow.inventory 
         WHERE product_id = $1 AND warehouse_id = $2 
         FOR UPDATE`,
        [productId, sourceWarehouse]
      );

      const availableSrcQty = srcInv.rows.length > 0 ? srcInv.rows[0].quantity : 0;
      if (availableSrcQty < qty) {
        throw new Error(`Insufficient stock in source warehouse. Available: ${availableSrcQty}, requested: ${qty}`);
      }

      // 2. Lock destination warehouse and check capacity
      const dstWh = await client.query(
        `SELECT capacity,
                (SELECT COALESCE(SUM(quantity), 0) FROM stockflow.inventory WHERE warehouse_id = $1) as current_stock
         FROM stockflow.warehouses 
         WHERE warehouse_id = $1 
         FOR UPDATE`,
        [destinationWarehouse]
      );

      if (dstWh.rows.length === 0) {
        throw new Error('Destination warehouse not found');
      }

      const dstCapacity = dstWh.rows[0].capacity;
      const dstCurrentStock = parseInt(dstWh.rows[0].current_stock, 10);

      if (dstCurrentStock + qty > dstCapacity) {
        throw new Error(`Destination warehouse capacity exceeded. Available space: ${dstCapacity - dstCurrentStock}`);
      }

      // 3. Decrement source warehouse inventory
      await client.query(
        `UPDATE stockflow.inventory 
         SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
         WHERE product_id = $2 AND warehouse_id = $3`,
        [qty, productId, sourceWarehouse]
      );

      // 4. Increment or insert destination inventory
      await client.query(
        `INSERT INTO stockflow.inventory (product_id, warehouse_id, quantity, last_updated)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = stockflow.inventory.quantity + EXCLUDED.quantity, last_updated = CURRENT_TIMESTAMP`,
        [productId, destinationWarehouse, qty]
      );

      // 5. Record TRANSFER transaction
      await client.query(
        `INSERT INTO stockflow.stock_transactions 
          (product_id, source_warehouse, destination_warehouse, transaction_type, quantity, transaction_time, remarks)
         VALUES ($1, $2, $3, 'TRANSFER', $4, CURRENT_TIMESTAMP, $5)`,
        [productId, sourceWarehouse, destinationWarehouse, qty, remarks || 'Warehouse Stock Transfer']
      );
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${qty} units.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
