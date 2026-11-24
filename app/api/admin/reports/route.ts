import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const reportType = url.searchParams.get('type') || 'valuation';

  try {
    let data: any[] = [];

    switch (reportType) {
      case 'valuation': {
        const res = await query(`
          SELECT 
            p.product_id,
            p.name as product_name,
            p.category,
            p.price as unit_price,
            COALESCE(SUM(i.quantity), 0) as total_quantity,
            COALESCE(SUM(i.quantity * p.price), 0) as total_valuation,
            COUNT(DISTINCT i.warehouse_id) as warehouses_stored
          FROM stockflow.products p
          LEFT JOIN stockflow.inventory i ON p.product_id = i.product_id
          GROUP BY p.product_id, p.name, p.category, p.price
          ORDER BY total_valuation DESC
        `);
        data = res.rows;
        break;
      }

      case 'low_stock': {
        const res = await query(`
          SELECT 
            p.product_id,
            p.name as product_name,
            p.category,
            p.price,
            p.reorder_level,
            COALESCE(SUM(i.quantity), 0) as current_stock,
            CASE 
              WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'Critical: Out of Stock'
              ELSE 'Warning: Reorder Needed'
            END as alert_severity
          FROM stockflow.products p
          LEFT JOIN stockflow.inventory i ON p.product_id = i.product_id
          GROUP BY p.product_id, p.name, p.category, p.price, p.reorder_level
          HAVING COALESCE(SUM(i.quantity), 0) <= p.reorder_level
          ORDER BY current_stock ASC
        `);
        data = res.rows;
        break;
      }

      case 'warehouse_utilization': {
        const res = await query(`
          SELECT 
            w.warehouse_id,
            w.name as warehouse_name,
            w.location,
            w.capacity,
            COALESCE(SUM(i.quantity), 0) as occupied_units,
            GREATEST(0, w.capacity - COALESCE(SUM(i.quantity), 0)) as available_units,
            ROUND((COALESCE(SUM(i.quantity), 0)::numeric / NULLIF(w.capacity, 0)) * 100, 2) as utilization_rate_percent,
            COALESCE(SUM(i.quantity * p.price), 0) as stored_inventory_value
          FROM stockflow.warehouses w
          LEFT JOIN stockflow.inventory i ON w.warehouse_id = i.warehouse_id
          LEFT JOIN stockflow.products p ON i.product_id = p.product_id
          GROUP BY w.warehouse_id, w.name, w.location, w.capacity
          ORDER BY utilization_rate_percent DESC
        `);
        data = res.rows;
        break;
      }

      case 'supplier_purchases': {
        const res = await query(`
          SELECT 
            s.supplier_id,
            s.company as supplier_company,
            s.name as contact_person,
            s.email,
            COUNT(po.order_id) as total_orders_placed,
            COUNT(CASE WHEN po.status = 'Received' THEN 1 END) as received_orders,
            COUNT(CASE WHEN po.status = 'Pending' THEN 1 END) as pending_orders,
            COALESCE(SUM(CASE WHEN po.status = 'Received' THEN oi.quantity * oi.unit_price ELSE 0 END), 0) as total_procurement_cost
          FROM stockflow.suppliers s
          LEFT JOIN stockflow.purchase_orders po ON s.supplier_id = po.supplier_id
          LEFT JOIN stockflow.order_items oi ON po.order_id = oi.order_id
          GROUP BY s.supplier_id, s.company, s.name, s.email
          ORDER BY total_procurement_cost DESC
        `);
        data = res.rows;
        break;
      }

      case 'stock_movements': {
        const res = await query(`
          SELECT 
            t.transaction_id,
            t.transaction_time,
            t.product_id,
            p.name as product_name,
            t.transaction_type,
            t.quantity,
            COALESCE(sw.name, 'External Supplier / Vendor') as source_facility,
            COALESCE(dw.name, 'Customer / Dispatch') as destination_facility,
            t.remarks
          FROM stockflow.stock_transactions t
          JOIN stockflow.products p ON t.product_id = p.product_id
          LEFT JOIN stockflow.warehouses sw ON t.source_warehouse = sw.warehouse_id
          LEFT JOIN stockflow.warehouses dw ON t.destination_warehouse = dw.warehouse_id
          ORDER BY t.transaction_time DESC
          LIMIT 100
        `);
        data = res.rows;
        break;
      }

      case 'best_sellers': {
        const res = await query(`
          SELECT 
            p.product_id,
            p.name as product_name,
            p.category,
            p.price,
            COALESCE(SUM(coi.quantity), 0) as total_units_sold,
            COALESCE(SUM(coi.line_total), 0) as total_sales_revenue
          FROM stockflow.products p
          LEFT JOIN stockflow.customer_order_items coi ON p.product_id = coi.product_id
          GROUP BY p.product_id, p.name, p.category, p.price
          ORDER BY total_units_sold DESC, total_sales_revenue DESC
        `);
        data = res.rows;
        break;
      }

      case 'sales_performance': {
        const res = await query(`
          SELECT 
            co.customer_order_id,
            co.order_date,
            u.full_name as customer_name,
            u.email as customer_email,
            co.order_status,
            co.payment_status,
            co.total_amount,
            COUNT(coi.customer_order_item_id) as items_count
          FROM stockflow.customer_orders co
          JOIN stockflow.users u ON co.user_id = u.user_id
          LEFT JOIN stockflow.customer_order_items coi ON co.customer_order_id = coi.customer_order_id
          GROUP BY co.customer_order_id, co.order_date, u.full_name, u.email, co.order_status, co.payment_status, co.total_amount
          ORDER BY co.order_date DESC
        `);
        data = res.rows;
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, reportType, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
