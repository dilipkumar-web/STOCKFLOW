import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    // 1. Total products
    const prodRes = await query(`SELECT COUNT(*) as total FROM stockflow.products`);
    const totalProducts = parseInt(prodRes.rows[0]?.total || '0', 10);

    // 2. Total stock quantity & inventory value
    const invRes = await query(`
      SELECT 
        COALESCE(SUM(i.quantity), 0) as total_qty,
        COALESCE(SUM(i.quantity * p.price), 0) as total_value
      FROM stockflow.inventory i
      JOIN stockflow.products p ON i.product_id = p.product_id
    `);
    const totalStockQuantity = parseInt(invRes.rows[0]?.total_qty || '0', 10);
    const totalInventoryValue = parseFloat(invRes.rows[0]?.total_value || '0');

    // 3. Total suppliers
    const supRes = await query(`SELECT COUNT(*) as total FROM stockflow.suppliers`);
    const totalSuppliers = parseInt(supRes.rows[0]?.total || '0', 10);

    // 4. Total warehouses
    const whRes = await query(`SELECT COUNT(*) as total FROM stockflow.warehouses`);
    const totalWarehouses = parseInt(whRes.rows[0]?.total || '0', 10);

    // 5. Pending purchase orders
    const poRes = await query(`SELECT COUNT(*) as total FROM stockflow.purchase_orders WHERE status = 'Pending'`);
    const pendingPurchaseOrders = parseInt(poRes.rows[0]?.total || '0', 10);

    // 6. Total customer orders (check table existence first)
    let totalCustomerOrders = 0;
    try {
      const coRes = await query(`SELECT COUNT(*) as total FROM stockflow.customer_orders`);
      totalCustomerOrders = parseInt(coRes.rows[0]?.total || '0', 10);
    } catch {
      totalCustomerOrders = 0;
    }

    // 7. Low stock products (total stock across warehouses <= reorder_level)
    const lowStockRes = await query(`
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.price,
        p.reorder_level,
        COALESCE(SUM(i.quantity), 0) as total_stock
      FROM stockflow.products p
      LEFT JOIN stockflow.inventory i ON p.product_id = i.product_id
      GROUP BY p.product_id, p.name, p.category, p.price, p.reorder_level
      HAVING COALESCE(SUM(i.quantity), 0) <= p.reorder_level
      ORDER BY total_stock ASC
      LIMIT 10
    `);

    // 8. Charts: Inventory distribution by warehouse
    const whDistRes = await query(`
      SELECT 
        w.name as warehouse,
        COALESCE(SUM(i.quantity), 0) as quantity,
        COALESCE(SUM(i.quantity * p.price), 0) as value
      FROM stockflow.warehouses w
      LEFT JOIN stockflow.inventory i ON w.warehouse_id = i.warehouse_id
      LEFT JOIN stockflow.products p ON i.product_id = p.product_id
      GROUP BY w.warehouse_id, w.name
      ORDER BY quantity DESC
    `);

    // 9. Charts: Products by category
    const catRes = await query(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.product_id) as count,
        COALESCE(SUM(i.quantity), 0) as stock
      FROM stockflow.products p
      LEFT JOIN stockflow.inventory i ON p.product_id = i.product_id
      GROUP BY p.category
      ORDER BY stock DESC
    `);

    // 10. Charts: Stock movement trends (grouped by date)
    const trendsRes = await query(`
      SELECT 
        TO_CHAR(transaction_time, 'YYYY-MM-DD') as date,
        SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END) as "inQty",
        SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END) as "outQty",
        SUM(CASE WHEN transaction_type = 'TRANSFER' THEN quantity ELSE 0 END) as "transferQty"
      FROM stockflow.stock_transactions
      WHERE transaction_time >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY TO_CHAR(transaction_time, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    // 11. Charts: PO Status distribution
    const poStatusRes = await query(`
      SELECT status, COUNT(*) as count 
      FROM stockflow.purchase_orders 
      GROUP BY status
    `);

    // 12. Charts: Customer Order status distribution
    let coStatusRows: any[] = [];
    try {
      const coStatusRes = await query(`
        SELECT order_status as status, COUNT(*) as count 
        FROM stockflow.customer_orders 
        GROUP BY order_status
      `);
      coStatusRows = coStatusRes.rows;
    } catch {
      coStatusRows = [];
    }

    // 13. Charts: Warehouse utilization
    const utilRes = await query(`
      SELECT 
        w.name,
        w.capacity,
        COALESCE(SUM(i.quantity), 0) as current,
        ROUND((COALESCE(SUM(i.quantity), 0)::numeric / NULLIF(w.capacity, 0)) * 100, 1) as percentage
      FROM stockflow.warehouses w
      LEFT JOIN stockflow.inventory i ON w.warehouse_id = i.warehouse_id
      GROUP BY w.warehouse_id, w.name, w.capacity
      ORDER BY percentage DESC
    `);

    // 14. Recent transactions
    const txRes = await query(`
      SELECT 
        t.transaction_id,
        t.product_id,
        p.name as product_name,
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
      ORDER BY t.transaction_time DESC
      LIMIT 8
    `);

    // 15. Recent customer orders
    let recentCustomerOrders: any[] = [];
    try {
      const recentCORes = await query(`
        SELECT 
          co.customer_order_id,
          co.user_id,
          u.full_name,
          co.order_date,
          co.total_amount,
          co.order_status,
          co.payment_status
        FROM stockflow.customer_orders co
        LEFT JOIN stockflow.users u ON co.user_id = u.user_id
        ORDER BY co.order_date DESC
        LIMIT 6
      `);
      recentCustomerOrders = recentCORes.rows;
    } catch {
      recentCustomerOrders = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalStockQuantity,
        totalInventoryValue,
        totalSuppliers,
        totalWarehouses,
        pendingPurchaseOrders,
        totalCustomerOrders,
        lowStockCount: lowStockRes.rows.length,
        recentTransactions: txRes.rows,
        recentCustomerOrders,
        lowStockProducts: lowStockRes.rows,
        charts: {
          inventoryByWarehouse: whDistRes.rows,
          productsByCategory: catRes.rows,
          stockMovements: trendsRes.rows,
          purchaseOrderStatus: poStatusRes.rows,
          customerOrderStatus: coStatusRows,
          warehouseUtilization: utilRes.rows,
        },
      },
    });
  } catch (error: any) {
    console.error('[ADMIN DASHBOARD API ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
