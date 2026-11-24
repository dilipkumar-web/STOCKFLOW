'use client';

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Calendar,
  ArrowRight,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function ClientOrdersPage() {
  const { error } = useToast();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch {
      error("Failed to load your orders");
    } finally {
      setLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Purchase Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review past orders, ordered line items, and fulfillment history.
          </p>
        </div>
        <Link href="/client/tracking">
          <Button variant="outline" size="sm" className="text-xs">
            Live Order Tracking Timeline →
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading your purchase history...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">You haven&apos;t placed any orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse our product catalog to place your first inventory purchase.
          </p>
          <Link href="/client/products">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
              Explore Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const badge = getStatusBadgeStyle(ord.order_status);
            return (
              <div
                key={ord.customer_order_id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {ord.customer_order_id}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(ord.order_date, true)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {ord.order_status}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedOrder(ord)}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white h-7 px-2"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Items
                    </Button>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {ord.items?.map((item: any) => (
                    <div key={item.customer_order_item_id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[150px]">
                          {item.product_name}
                        </span>
                        <span className="text-slate-500">{item.quantity} units</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-500">
                    Payment: <strong className="text-slate-700 dark:text-slate-300">{ord.payment_status}</strong>
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-slate-500">Total Paid:</span>
                    <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(ord.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)} title={`Order: ${selectedOrder?.customer_order_id}`}>
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedOrder.order_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Placed:</span>
                <span className="text-slate-700 dark:text-slate-300">{formatDate(selectedOrder.order_date, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping Address:</span>
                <span className="text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{selectedOrder.shipping_address}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Price</th>
                    <th className="p-2.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedOrder.items?.map((item: any) => (
                    <tr key={item.customer_order_item_id}>
                      <td className="p-2.5 font-bold">{item.product_name}</td>
                      <td className="p-2.5 font-mono">{item.quantity}</td>
                      <td className="p-2.5 font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-600">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Total:</span>
              <span className="text-base font-black font-mono text-emerald-600">
                {formatCurrency(selectedOrder.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
