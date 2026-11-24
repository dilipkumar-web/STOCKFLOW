import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Receive Pending Purchase Order: Single atomic transaction
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const orderId = params.id;

    const result = await withTransaction(async (client) => {
      // 1. Verify PO exists and is Pending with row lock
      const poCheck = await client.query(
        `SELECT order_id, warehouse_id, status 
         FROM stockflow.purchase_orders 
         WHERE order_id = $1 
         FOR UPDATE`,
        [orderId]
      );

      if (poCheck.rows.length === 0) {
        throw new Error('Purchase order not found');
      }

      const po = poCheck.rows[0];
      if (po.status !== 'Pending') {
        throw new Error(`Cannot receive order with status: "${po.status}". Duplicate receipt prevented.`);
      }

      // 2. Fetch order items
      const itemsRes = await client.query(
        `SELECT product_id, quantity, unit_price 
         FROM stockflow.order_items 
         WHERE order_id = $1`,
        [orderId]
      );

      if (itemsRes.rows.length === 0) {
        throw new Error('Purchase order contains no items to receive.');
      }

      const totalIncomingQty = itemsRes.rows.reduce(
        (sum, item) => sum + parseInt(item.quantity, 10),
        0
      );

      // 3. Check destination warehouse capacity with row lock
      const whCheck = await client.query(
        `SELECT capacity,
                (SELECT COALESCE(SUM(quantity), 0) FROM stockflow.inventory WHERE warehouse_id = $1) as current_stock
         FROM stockflow.warehouses 
         WHERE warehouse_id = $1 
         FOR UPDATE`,
        [po.warehouse_id]
      );

      if (whCheck.rows.length === 0) {
        throw new Error('Destination warehouse not found');
      }

      const capacity = whCheck.rows[0].capacity;
      const currentStock = parseInt(whCheck.rows[0].current_stock, 10);

      if (currentStock + totalIncomingQty > capacity) {
        throw new Error(
          `Warehouse capacity exceeded. Available: ${capacity - currentStock}, Incoming: ${totalIncomingQty}`
        );
      }

      // 4. Update inventory and record IN stock transactions
      for (const item of itemsRes.rows) {
        const qty = parseInt(item.quantity, 10);

        // Upsert inventory
        await client.query(
          `INSERT INTO stockflow.inventory (product_id, warehouse_id, quantity, last_updated)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (product_id, warehouse_id)
           DO UPDATE SET quantity = stockflow.inventory.quantity + EXCLUDED.quantity, last_updated = CURRENT_TIMESTAMP`,
          [item.product_id, po.warehouse_id, qty]
        );

        // Record stock transaction IN
        await client.query(
          `INSERT INTO stockflow.stock_transactions 
            (product_id, destination_warehouse, transaction_type, quantity, transaction_time, remarks)
           VALUES ($1, $2, 'IN', $3, CURRENT_TIMESTAMP, $4)`,
          [item.product_id, po.warehouse_id, qty, `Received from Purchase Order ${orderId}`]
        );
      }

      // 5. Update purchase order status to Received and set received_date
      await client.query(
        `UPDATE stockflow.purchase_orders
         SET status = 'Received', received_date = CURRENT_DATE
         WHERE order_id = $1`,
        [orderId]
      );

      return { orderId, itemsCount: itemsRes.rows.length, totalQty: totalIncomingQty };
    });

    return NextResponse.json({
      success: true,
      message: `Purchase Order ${result.orderId} received successfully. ${result.totalQty} units added to inventory.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
