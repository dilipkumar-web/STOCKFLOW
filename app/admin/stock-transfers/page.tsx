'use client';

import * as React from "react";
import {
  ArrowLeftRight,
  Warehouse,
  Package,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function AdminStockTransfersPage() {
  const { success, error } = useToast();
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [productId, setProductId] = React.useState("");
  const [sourceWarehouse, setSourceWarehouse] = React.useState("");
  const [destWarehouse, setDestWarehouse] = React.useState("");
  const [quantity, setQuantity] = React.useState("10");
  const [remarks, setRemarks] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Live stock & destination capacity checks
  const [availableStock, setAvailableStock] = React.useState<number | null>(null);
  const [destAvailableCapacity, setDestAvailableCapacity] = React.useState<number | null>(null);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/admin/warehouses').then((r) => r.json()),
      fetch('/api/admin/products?limit=100').then((r) => r.json()),
    ]).then(([wh, prod]) => {
      if (wh.success) setWarehouses(wh.data);
      if (prod.success) setProducts(prod.data);
      setLoading(false);
    });
  }, []);

  // Update source stock when product and source change
  React.useEffect(() => {
    if (productId && sourceWarehouse) {
      fetch(`/api/admin/inventory?warehouseId=${sourceWarehouse}&search=${productId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data.length > 0) {
            const found = json.data.find((i: any) => i.product_id === productId);
            setAvailableStock(found ? found.quantity : 0);
          } else {
            setAvailableStock(0);
          }
        })
        .catch(() => setAvailableStock(0));
    } else {
      setAvailableStock(null);
    }
  }, [productId, sourceWarehouse]);

  // Update destination capacity
  React.useEffect(() => {
    if (destWarehouse) {
      const wh = warehouses.find((w) => w.warehouse_id === destWarehouse);
      if (wh) {
        setDestAvailableCapacity(wh.available_capacity ?? 0);
      }
    } else {
      setDestAvailableCapacity(null);
    }
  }, [destWarehouse, warehouses]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !sourceWarehouse || !destWarehouse) {
      error("Please select product, source facility, and destination facility");
      return;
    }

    if (sourceWarehouse === destWarehouse) {
      error("Source and destination warehouses cannot be identical");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      error("Transfer quantity must be positive");
      return;
    }

    if (availableStock !== null && qty > availableStock) {
      error(`Cannot transfer ${qty} units. Only ${availableStock} units available at source warehouse.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          sourceWarehouse,
          destinationWarehouse: destWarehouse,
          quantity: qty,
          remarks: remarks || 'Internal Inter-Warehouse Stock Relocation',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to complete stock transfer');

      success(json.message);
      setQuantity("10");
      setRemarks("");
      // Refresh warehouses
      const whRes = await fetch('/api/admin/warehouses');
      const whJson = await whRes.json();
      if (whJson.success) setWarehouses(whJson.data);
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Inter-Warehouse Stock Relocation</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Execute atomic stock transfers between logistics facilities with ACID concurrency row locking and capacity checks.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
        <form onSubmit={handleTransfer} className="space-y-6">
          {/* Product Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Product SKU to Transfer *
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose product SKU...</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.name} — {p.product_id} ({p.category}) [{formatCurrency(p.price)}]
                </option>
              ))}
            </select>
          </div>

          {/* Facility Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            {/* Source Warehouse */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Warehouse className="w-4 h-4" />
                <span>Source Facility (Stock Decrement)</span>
              </div>
              <select
                required
                value={sourceWarehouse}
                onChange={(e) => setSourceWarehouse(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select origin facility...</option>
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>
                    {w.name} ({w.location})
                  </option>
                ))}
              </select>
              {availableStock !== null && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between">
                  <span className="text-slate-400">Available at Source:</span>
                  <span className={`font-mono font-bold ${availableStock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {availableStock} units
                  </span>
                </div>
              )}
            </div>

            {/* Destination Warehouse */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                <Warehouse className="w-4 h-4" />
                <span>Destination Facility (Stock Inward)</span>
              </div>
              <select
                required
                value={destWarehouse}
                onChange={(e) => setDestWarehouse(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select destination facility...</option>
                {warehouses
                  .filter((w) => w.warehouse_id !== sourceWarehouse)
                  .map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.name} ({w.location})
                    </option>
                  ))}
              </select>
              {destAvailableCapacity !== null && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between">
                  <span className="text-slate-400">Facility Space Headroom:</span>
                  <span className="font-mono font-bold text-teal-400">
                    {destAvailableCapacity} units
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity & Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quantity to Relocate *"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-slate-900 border-slate-800 text-white"
            />
            <Input
              label="Transfer Reason / Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Rebalancing regional fulfillment center buffer"
              className="bg-slate-900 border-slate-800 text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button
              type="submit"
              isLoading={submitting}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-11 text-sm font-semibold shadow-lg shadow-blue-500/25"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Execute Atomic Stock Transfer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
