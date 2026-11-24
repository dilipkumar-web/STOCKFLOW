import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const orderRes = await query(
      `SELECT co.*, u.full_name, u.email, u.phone
       FROM stockflow.customer_orders co
       JOIN stockflow.users u ON co.user_id = u.user_id
       WHERE co.customer_order_id = $1`,
      [params.id]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Customer order not found' }, { status: 404 });
    }

    const itemsRes = await query(
      `SELECT coi.*, p.name as product_name, p.category
       FROM stockflow.customer_order_items coi
       JOIN stockflow.products p ON coi.product_id = p.product_id
       WHERE coi.customer_order_id = $1`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...orderRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update order status / dispatch. If cancelling, restores allocated inventory atomically!
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { orderStatus, carrier, trackingNumber } = body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid order status' }, { status: 400 });
    }

    const orderId = params.id;

    await withTransaction(async (client) => {
      // 1. Lock customer order
      const coRes = await client.query(
        `SELECT customer_order_id, order_status 
         FROM stockflow.customer_orders 
         WHERE customer_order_id = $1 
         FOR UPDATE`,
        [orderId]
      );

      if (coRes.rows.length === 0) {
        throw new Error('Customer order not found');
      }

      const currentStatus = coRes.rows[0].order_status;

      // If cancelling an active order: restore stock!
      if (orderStatus === 'Cancelled') {
        if (currentStatus === 'Cancelled') {
          throw new Error('Order is already cancelled. Double restoration prevented.');
        }

        // Find which warehouse the items were originally deducted from via stock_transactions remarks!
        const itemsRes = await client.query(
          `SELECT product_id, quantity 
           FROM stockflow.customer_order_items 
           WHERE customer_order_id = $1`,
          [orderId]
        );

        // Fetch primary or default warehouse for restoration
        const defaultWhRes = await client.query(
          `SELECT warehouse_id FROM stockflow.warehouses ORDER BY warehouse_id ASC LIMIT 1`
        );
        const defaultWh = defaultWhRes.rows[0]?.warehouse_id;

        for (const item of itemsRes.rows) {
          const qty = parseInt(item.quantity, 10);

          // Restore inventory
          await client.query(
            `INSERT INTO stockflow.inventory (product_id, warehouse_id, quantity, last_updated)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (product_id, warehouse_id)
             DO UPDATE SET quantity = stockflow.inventory.quantity + EXCLUDED.quantity, last_updated = CURRENT_TIMESTAMP`,
            [item.product_id, defaultWh, qty]
          );

          // Record IN transaction for restoration
          await client.query(
            `INSERT INTO stockflow.stock_transactions 
              (product_id, destination_warehouse, transaction_type, quantity, transaction_time, remarks)
             VALUES ($1, $2, 'IN', $3, CURRENT_TIMESTAMP, $4)`,
            [item.product_id, defaultWh, qty, `Restored from Cancelled Order ${orderId}`]
          );
        }
      }

      // Update status and dispatch metadata
      if (orderStatus === 'Shipped') {
        await client.query(
          `UPDATE stockflow.customer_orders 
           SET order_status = $1, 
               carrier = COALESCE($2, carrier), 
               tracking_number = COALESCE($3, tracking_number),
               dispatched_at = COALESCE(dispatched_at, CURRENT_TIMESTAMP),
               updated_at = CURRENT_TIMESTAMP
           WHERE customer_order_id = $4`,
          [orderStatus, carrier || null, trackingNumber || null, orderId]
        );
      } else {
        await client.query(
          `UPDATE stockflow.customer_orders 
           SET order_status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE customer_order_id = $2`,
          [orderStatus, orderId]
        );
      }
    });

    return NextResponse.json({
      success: true,
      message: orderStatus === 'Shipped' 
        ? `Order ${orderId} has been successfully dispatched!` 
        : `Order status updated to ${orderStatus}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
