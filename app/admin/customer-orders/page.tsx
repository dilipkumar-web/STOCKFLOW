'use client';

import * as React from "react";
import {
  ShoppingBag,
  Search,
  Download,
  Eye,
  CheckCircle,
  Truck,
  RotateCcw,
  Send,
  Sparkles,
  MapPin,
  Package,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate, exportToCSV, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const POPULAR_CARRIERS = [
  "Blue Dart Express",
  "Delhivery Logistics",
  "DTDC Express",
  "FedEx Freight",
  "Shadowfax E-Commerce",
  "Speed Post (India Post)",
  "Internal Warehouse Fleet",
  "Other Carrier",
];

export default function AdminCustomerOrdersPage() {
  const { success, error } = useToast();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);

  // Dispatch Modal State
  const [dispatchOrder, setDispatchOrder] = React.useState<any>(null);
  const [isDispatchOpen, setIsDispatchOpen] = React.useState(false);
  const [carrier, setCarrier] = React.useState("Blue Dart Express");
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [dispatching, setDispatching] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/customer-orders?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch {
      error("Failed to load customer orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, error]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'Cancelled') {
      if (!confirm(`Are you sure you want to cancel Order "${orderId}"? This will atomically restore all allocated stock back to inventory and log IN audit transactions.`)) return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/customer-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update order status');

      success(json.message);
      setIsDetailsOpen(false);
      fetchOrders();
    } catch (err: any) {
      error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const openOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/customer-orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        setIsDetailsOpen(true);
      }
    } catch {
      error("Failed to load customer order details");
    }
  };

  const generateTrackingNumber = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const prefix = carrier.split(" ")[0].toUpperCase();
    setTrackingNumber(`SF-${prefix}-${randomSuffix}`);
  };

  const openDispatchModal = async (order: any) => {
    // If order doesn't have items fetched, fetch full details
    if (!order.items) {
      try {
        const res = await fetch(`/api/admin/customer-orders/${order.customer_order_id}`);
        const json = await res.json();
        if (json.success) {
          setDispatchOrder(json.data);
        } else {
          setDispatchOrder(order);
        }
      } catch {
        setDispatchOrder(order);
      }
    } else {
      setDispatchOrder(order);
    }

    const defaultCarrier = order.carrier || "Blue Dart Express";
    setCarrier(defaultCarrier);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setTrackingNumber(order.tracking_number || `SF-${defaultCarrier.split(" ")[0].toUpperCase()}-${randomSuffix}`);
    setIsDispatchOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchOrder) return;
    setDispatching(true);

    try {
      const res = await fetch(`/api/admin/customer-orders/${dispatchOrder.customer_order_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: 'Shipped',
          carrier: carrier.trim() || 'Standard Delivery',
          trackingNumber: trackingNumber.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to dispatch order');

      success(json.message || `Order ${dispatchOrder.customer_order_id} successfully dispatched!`);
      setIsDispatchOpen(false);
      setIsDetailsOpen(false);
      setDispatchOrder(null);
      fetchOrders();
    } catch (err: any) {
      error(err.message);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Order Fulfillment &amp; Dispatch</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage customer purchases, dispatch packages with courier tracking, and maintain real-time inventory control.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_customer_orders", orders)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by order ID, customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Fulfillment Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped (Dispatched)</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Courier / Tracking</th>
                <th className="py-3 px-4 text-right">Dispatch &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No customer orders match the current filter.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const badge = getStatusBadgeStyle(ord.order_status);
                  const canDispatch = ['Pending', 'Confirmed', 'Processing'].includes(ord.order_status);
                  const isDispatched = ord.order_status === 'Shipped';
                  const isDelivered = ord.order_status === 'Delivered';

                  return (
                    <tr key={ord.customer_order_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {ord.customer_order_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{ord.full_name}</span>
                        <span className="text-[10px] text-slate-500">{ord.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(ord.order_date, true)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {formatCurrency(ord.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[180px] truncate" title={ord.shipping_address}>
                        {ord.shipping_address}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {ord.carrier ? (
                          <div>
                            <span className="font-semibold text-slate-200 block">{ord.carrier}</span>
                            <span className="font-mono text-[10px] text-blue-400">{ord.tracking_number || 'No tracking ID'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Not Dispatched</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Direct Dispatch Option */}
                          {canDispatch && (
                            <Button
                              size="sm"
                              onClick={() => openDispatchModal(ord)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-8 px-2.5 shadow-sm"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Dispatch
                            </Button>
                          )}

                          {isDispatched && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(ord.customer_order_id, 'Delivered')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-2.5 shadow-sm"
                              title="Mark order as delivered"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Delivered
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openOrderDetails(ord.customer_order_id)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8 px-2"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDICATED DISPATCH ORDER MODAL */}
      <Modal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        title={`🚚 Dispatch Order ${dispatchOrder?.customer_order_id}`}
        maxWidth="lg"
      >
        {dispatchOrder && (
          <div className="space-y-4 text-xs">
            {/* Order Destination Brief */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recipient Customer:</span>
                <span className="font-bold text-white text-sm">{dispatchOrder.full_name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-rose-400" /> Ship To:
                </span>
                <span className="text-right text-slate-200 font-medium max-w-xs">{dispatchOrder.shipping_address}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Total Valuation:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(dispatchOrder.total_amount)}</span>
              </div>
            </div>

            {/* Courier Selection */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 text-xs">
                Logistics / Courier Partner <span className="text-rose-500">*</span>
              </label>
              <select
                value={carrier}
                onChange={(e) => {
                  setCarrier(e.target.value);
                  const prefix = e.target.value.split(" ")[0].toUpperCase();
                  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
                  setTrackingNumber(`SF-${prefix}-${randomSuffix}`);
                }}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POPULAR_CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-semibold text-xs">
                  Tracking / Consignment Waybill # <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateTrackingNumber}
                  className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Auto-Generate
                </button>
              </div>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. SF-BLUEDART-839210"
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Item Breakdown Preview */}
            {dispatchOrder.items && dispatchOrder.items.length > 0 && (
              <div>
                <span className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Package Contents ({dispatchOrder.items.length} products):
                </span>
                <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800">
                  {dispatchOrder.items.map((it: any) => (
                    <div key={it.customer_order_item_id} className="p-2 flex justify-between items-center text-[11px]">
                      <span className="text-white font-medium truncate max-w-[200px]">{it.product_name}</span>
                      <span className="font-mono text-blue-400 font-bold">Qty: {it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDispatchOpen(false)}
                className="border-slate-800 text-slate-300 hover:text-white text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDispatch}
                disabled={dispatching || !trackingNumber.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 px-4 shadow-lg shadow-blue-500/20"
              >
                {dispatching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-2" />
                    Confirm &amp; Dispatch Order
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Details & Lifecycle Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={`Fulfillment: ${selectedOrder?.customer_order_id}`} maxWidth="2xl">
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Customer Name</span>
                <span className="font-bold text-white">{selectedOrder.full_name}</span>
                <span className="text-[10px] text-slate-400 block">{selectedOrder.phone || 'No phone'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Order Placed</span>
                <span className="font-semibold text-slate-200">{formatDate(selectedOrder.order_date, true)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Status</span>
                <span className="font-bold text-blue-400">{selectedOrder.order_status}</span>
              </div>
            </div>

            {/* Dispatch Banner inside Details Modal */}
            {['Pending', 'Confirmed', 'Processing'].includes(selectedOrder.order_status) ? (
              <div className="p-3.5 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-400 block flex items-center">
                    <Truck className="w-4 h-4 mr-1.5" /> Ready for Dispatch
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Allocate logistics partner and dispatch this order out for delivery.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openDispatchModal(selectedOrder);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-8 px-3 shadow"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Dispatch Order
                </Button>
              </div>
            ) : selectedOrder.carrier ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-400 block flex items-center">
                    <Truck className="w-4 h-4 mr-1.5" /> Dispatched via {selectedOrder.carrier}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Tracking Number: <code className="font-mono text-emerald-300 font-bold">{selectedOrder.tracking_number}</code>
                    {selectedOrder.dispatched_at && ` • Dispatched on ${formatDate(selectedOrder.dispatched_at, true)}`}
                  </p>
                </div>
                {selectedOrder.order_status === 'Shipped' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedOrder.customer_order_id, 'Delivered')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Mark Delivered
                  </Button>
                )}
              </div>
            ) : null}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Shipping Destination Address:</span>
              <p className="text-slate-200 mt-1 font-medium">{selectedOrder.shipping_address}</p>
            </div>

            <h4 className="font-bold text-white text-sm pt-2">Purchased Products</h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Quantity</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {selectedOrder.items?.map((item: any) => (
                    <tr key={item.customer_order_item_id}>
                      <td className="p-2.5 font-semibold text-white">
                        {item.product_name}
                        <span className="text-[10px] text-blue-400 block font-mono">{item.product_id}</span>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-white">{item.quantity}</td>
                      <td className="p-2.5 font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-400">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold">Grand Total:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {formatCurrency(selectedOrder.total_amount)}
              </span>
            </div>

            {/* Status Change Action Toolbar */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-2 font-semibold uppercase">Update Lifecycle State:</span>
              <div className="flex flex-wrap gap-2">
                {['Confirmed', 'Processing', 'Shipped', 'Delivered'].map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={selectedOrder.order_status === st ? 'default' : 'outline'}
                    disabled={updating || selectedOrder.order_status === 'Cancelled' || selectedOrder.order_status === 'Delivered'}
                    onClick={() => {
                      if (st === 'Shipped') {
                        setIsDetailsOpen(false);
                        openDispatchModal(selectedOrder);
                      } else {
                        handleUpdateStatus(selectedOrder.customer_order_id, st);
                      }
                    }}
                    className="text-xs h-8"
                  >
                    {st === 'Shipped' ? 'Dispatch (Shipped)' : st}
                  </Button>
                ))}

                {selectedOrder.order_status !== 'Cancelled' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedOrder.customer_order_id, 'Cancelled')}
                    className="text-xs h-8 ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Cancel Order &amp; Restore Stock
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
