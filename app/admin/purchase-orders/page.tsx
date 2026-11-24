'use client';

import * as React from "react";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate, exportToCSV, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function AdminPurchaseOrdersPage() {
  const { success, error } = useToast();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);

  // Create form state
  const [supplierId, setSupplierId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [expectedDelivery, setExpectedDelivery] = React.useState("");
  const [orderItems, setOrderItems] = React.useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: "", quantity: 10, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/purchase-orders?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch {
      error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, error]);

  React.useEffect(() => {
    fetchOrders();

    // Fetch suppliers, warehouses, products for creation modal
    Promise.all([
      fetch('/api/admin/suppliers').then((r) => r.json()),
      fetch('/api/admin/warehouses').then((r) => r.json()),
      fetch('/api/admin/products?limit=100').then((r) => r.json()),
    ]).then(([sup, wh, prod]) => {
      if (sup.success) setSuppliers(sup.data);
      if (wh.success) setWarehouses(wh.data);
      if (prod.success) setProducts(prod.data);
    });
  }, [fetchOrders]);

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 10, unitPrice: 0 }]);
  };

  const handleRemoveOrderItem = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, pId: string) => {
    const found = products.find((p) => p.product_id === pId);
    const updated = [...orderItems];
    updated[index].productId = pId;
    if (found) {
      updated[index].unitPrice = parseFloat(found.price);
    }
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !warehouseId) {
      error("Please select a supplier and destination warehouse");
      return;
    }

    const invalidItem = orderItems.find((i) => !i.productId || i.quantity <= 0);
    if (invalidItem) {
      error("Please select a valid product and positive quantity for all items");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          expected_delivery: expectedDelivery || null,
          items: orderItems.map((i) => ({
            product_id: i.productId,
            quantity: i.quantity,
            unit_price: i.unitPrice,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create purchase order');

      success(json.message);
      setIsCreateOpen(false);
      setSupplierId("");
      setWarehouseId("");
      setOrderItems([{ productId: "", quantity: 10, unitPrice: 0 }]);
      fetchOrders();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveOrder = async (orderId: string) => {
    if (!confirm(`Confirm receipt for Purchase Order "${orderId}"? This will atomically increase warehouse inventory and create IN transaction records.`)) return;
    try {
      const res = await fetch(`/api/admin/purchase-orders/${orderId}/receive`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to receive purchase order');
      success(json.message);
      fetchOrders();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to cancel Purchase Order "${orderId}"?`)) return;
    try {
      const res = await fetch(`/api/admin/purchase-orders/${orderId}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to cancel order');
      success(json.message);
      fetchOrders();
    } catch (err: any) {
      error(err.message);
    }
  };

  const openOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/purchase-orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        setIsDetailsOpen(true);
      }
    } catch {
      error("Failed to load order details");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Purchase Order Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Procurement lifecycle: Generate vendor POs, receive inventory into warehouses atomically, and audit logs.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_purchase_orders", orders)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by PO number, supplier, or warehouse..."
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
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Items / Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No purchase orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((po) => {
                  const badge = getStatusBadgeStyle(po.status);
                  return (
                    <tr key={po.order_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {po.order_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{po.supplier_company}</span>
                        <span className="text-[10px] text-slate-500">{po.supplier_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {po.warehouse_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(po.order_date, false)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {po.expected_delivery ? formatDate(po.expected_delivery, false) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{formatCurrency(po.total_amount)}</span>
                        <span className="text-[10px] text-slate-500">{po.total_items} item(s)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openOrderDetails(po.order_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {po.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleReceiveOrder(po.order_id)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Receive Order & Update Stock"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(po.order_id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Purchase Order" maxWidth="3xl">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.company} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Warehouse *</label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose Warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>
                    {w.name} ({w.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Expected Delivery Date"
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Purchase Order Items</span>
              <Button type="button" size="sm" variant="outline" onClick={handleAddOrderItem} className="border-slate-800 text-xs">
                + Add Another Product
              </Button>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Product SKU</th>
                    <th className="p-2.5 w-28">Quantity</th>
                    <th className="p-2.5 w-32">Unit Price (₹)</th>
                    <th className="p-2.5 w-32">Subtotal</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {orderItems.map((item, index) => (
                    <tr key={index}>
                      <td className="p-2">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                        >
                          <option value="">Select SKU...</option>
                          {products.map((p) => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.name} ({p.product_id})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[index].quantity = parseInt(e.target.value, 10) || 1;
                            setOrderItems(updated);
                          }}
                          className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[index].unitPrice = parseFloat(e.target.value) || 0;
                            setOrderItems(updated);
                          }}
                          className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                        />
                      </td>
                      <td className="p-2 font-mono font-semibold text-white">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="p-2 text-right">
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOrderItem(index)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-400">Total Purchase Value:</span>
              <span className="font-bold font-mono text-lg text-emerald-400">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Create Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* PO Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={`Purchase Order: ${selectedOrder?.order_id}`} maxWidth="2xl">
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Supplier</span>
                <span className="font-bold text-white">{selectedOrder.supplier_company}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Facility</span>
                <span className="font-bold text-white">{selectedOrder.warehouse_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Order Date</span>
                <span className="text-slate-300 font-mono">{formatDate(selectedOrder.order_date, false)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <span className="font-bold text-blue-400">{selectedOrder.status}</span>
              </div>
            </div>

            <h4 className="font-bold text-white text-sm pt-2">Purchased Product Line Items</h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">SKU / Product</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {selectedOrder.items?.map((item: any) => (
                    <tr key={item.item_id}>
                      <td className="p-2.5 font-semibold text-white">
                        {item.product_name}
                        <span className="text-[10px] text-blue-400 block font-mono">{item.product_id}</span>
                      </td>
                      <td className="p-2.5 text-slate-400">{item.category}</td>
                      <td className="p-2.5 font-mono font-bold text-white">{item.quantity}</td>
                      <td className="p-2.5 font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-400">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOrder.status === 'Pending' && (
              <div className="pt-3 flex justify-end space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleReceiveOrder(selectedOrder.order_id);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Receive Order Now
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
