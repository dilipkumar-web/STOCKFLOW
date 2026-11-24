import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST: Place customer order atomically!
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { shippingAddress, phone, paymentMethod = 'Cash on Delivery' } = body;

    if (!shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json({ success: false, error: 'Shipping address is required.' }, { status: 400 });
    }

    const orderId = `ORD-${Date.now().toString().slice(-7)}`;

    const result = await withTransaction(async (client) => {
      // 1. Fetch user's cart items with product price
      const cartRes = await client.query(
        `SELECT 
          c.cart_item_id,
          c.product_id,
          c.quantity,
          p.name as product_name,
          p.price
         FROM stockflow.cart_items c
         JOIN stockflow.products p ON c.product_id = p.product_id
         WHERE c.user_id = $1`,
        [user!.user_id]
      );

      if (cartRes.rows.length === 0) {
        throw new Error('Your cart is empty. Please add items before placing an order.');
      }

      // 2. Validate inventory for each item and allocate from warehouses
      let totalOrderAmount = 0;
      const allocationPlan: { productId: string; warehouseId: string; quantity: number }[] = [];

      for (const item of cartRes.rows) {
        const requiredQty = parseInt(item.quantity, 10);
        const unitPrice = parseFloat(item.price);
        totalOrderAmount += requiredQty * unitPrice;

        // Row-lock inventory for this product across warehouses
        const invRes = await client.query(
          `SELECT inventory_id, warehouse_id, quantity 
           FROM stockflow.inventory 
           WHERE product_id = $1 AND quantity > 0 
           ORDER BY quantity DESC 
           FOR UPDATE`,
          [item.product_id]
        );

        const totalAvailable = invRes.rows.reduce(
          (sum, row) => sum + parseInt(row.quantity, 10),
          0
        );

        if (totalAvailable < requiredQty) {
          throw new Error(
            `Insufficient stock for "${item.product_name}". Requested: ${requiredQty}, Available: ${totalAvailable}`
          );
        }

        // Allocate from warehouses (greedy allocation from highest stock warehouse)
        let remainingToAllocate = requiredQty;
        for (const whStock of invRes.rows) {
          if (remainingToAllocate <= 0) break;
          const whQty = parseInt(whStock.quantity, 10);
          const takeQty = Math.min(whQty, remainingToAllocate);

          allocationPlan.push({
            productId: item.product_id,
            warehouseId: whStock.warehouse_id,
            quantity: takeQty,
          });

          remainingToAllocate -= takeQty;
        }
      }

      // 3. Create customer_orders record
      await client.query(
        `INSERT INTO stockflow.customer_orders 
          (customer_order_id, user_id, order_date, total_amount, shipping_address, order_status, payment_status, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, 'Pending', $5, CURRENT_TIMESTAMP)`,
        [orderId, user!.user_id, totalOrderAmount, shippingAddress.trim(), paymentMethod]
      );

      // 4. Create customer_order_items records
      for (const item of cartRes.rows) {
        const qty = parseInt(item.quantity, 10);
        const price = parseFloat(item.price);
        const lineTotal = qty * price;

        await client.query(
          `INSERT INTO stockflow.customer_order_items 
            (customer_order_id, product_id, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.product_id, qty, price, lineTotal]
        );
      }

      // 5. Deduct inventory and record OUT stock transactions
      for (const alloc of allocationPlan) {
        await client.query(
          `UPDATE stockflow.inventory 
           SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
           WHERE product_id = $2 AND warehouse_id = $3`,
          [alloc.quantity, alloc.productId, alloc.warehouseId]
        );

        await client.query(
          `INSERT INTO stockflow.stock_transactions 
            (product_id, source_warehouse, transaction_type, quantity, transaction_time, remarks)
           VALUES ($1, $2, 'OUT', $3, CURRENT_TIMESTAMP, $4)`,
          [alloc.productId, alloc.warehouseId, alloc.quantity, `Customer Order ${orderId}`]
        );
      }

      // 6. Clear user's shopping cart
      await client.query(`DELETE FROM stockflow.cart_items WHERE user_id = $1`, [user!.user_id]);

      return {
        orderId,
        totalAmount: totalOrderAmount,
        itemCount: cartRes.rows.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully!',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
