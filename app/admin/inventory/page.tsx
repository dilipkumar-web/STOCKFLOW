'use client';

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  Sliders,
  Filter,
  Search,
  Download,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate, exportToCSV, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function AdminInventoryContent() {
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const initialLowStock = searchParams.get('lowStock') === 'true';

  const [inventory, setInventory] = React.useState<any[]>([]);
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [filterLowStock, setFilterLowStock] = React.useState(initialLowStock);

  // Modals state
  const [modalAction, setModalAction] = React.useState<'IN' | 'OUT' | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [adjustQty, setAdjustQty] = React.useState("10");
  const [adjustRemarks, setAdjustRemarks] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fetchInventory = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (warehouseId) params.set('warehouseId', warehouseId);
      if (filterLowStock) params.set('lowStock', 'true');

      const res = await fetch(`/api/admin/inventory?${params}`);
      const json = await res.json();
      if (json.success) {
        setInventory(json.data);
        setWarehouses(json.warehouses);
      }
    } catch {
      error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, [search, warehouseId, filterLowStock, error]);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction || !selectedItem) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: modalAction,
          productId: selectedItem.product_id,
          warehouseId: selectedItem.warehouse_id,
          quantity: adjustQty,
          remarks: adjustRemarks || `Manual Stock ${modalAction}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to record Stock ${modalAction}`);
      }

      success(json.message);
      setModalAction(null);
      setAdjustQty("10");
      setAdjustRemarks("");
      fetchInventory();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + parseFloat(item.item_value || '0'), 0);
  const totalUnits = inventory.reduce((sum, item) => sum + parseInt(item.quantity, 10), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Warehouse Inventory Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical stock counts by warehouse, atomic stock IN/OUT adjustments, and audit logging.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_inventory", inventory)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Aggregate Valuation Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Total Filtered SKUs</span>
          <p className="text-xl font-bold text-white mt-1">{inventory.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Total Units on Hand</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">{totalUnits.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Total Stock Value</span>
          <p className="text-xl font-bold text-teal-400 mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Low Stock Filter</span>
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`mt-1 inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              filterLowStock
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{filterLowStock ? 'Showing Low Stock' : 'Show All'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product, SKU or warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.warehouse_id} value={w.warehouse_id}>
                {w.name} ({w.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Product SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Warehouse Facility</th>
                <th className="py-3 px-4">Units Available</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4">Valuation</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Stock Adjustments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Calculating inventory positions...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No inventory records match the current filter.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const badge = getStatusBadgeStyle(item.stock_status);
                  return (
                    <tr key={`${item.product_id}_${item.warehouse_id}`} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {item.product_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white max-w-[180px] truncate">
                        {item.product_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-medium text-white">{item.warehouse_name}</span>
                        <span className="text-[10px] text-slate-500 block">{item.warehouse_location}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-base text-white">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {item.reorder_level}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {item.stock_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {formatCurrency(item.item_value)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(item.last_updated, true)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setModalAction('IN');
                          }}
                          className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs h-7 px-2.5"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
                          IN
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setModalAction('OUT');
                          }}
                          className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs h-7 px-2.5"
                        >
                          <ArrowUpFromLine className="w-3.5 h-3.5 mr-1" />
                          OUT
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock IN / OUT Adjustment Modal */}
      <Modal
        isOpen={modalAction !== null}
        onClose={() => setModalAction(null)}
        title={modalAction === 'IN' ? `Stock Inward Receipt (IN)` : `Stock Dispatch / Adjustment (OUT)`}
        description={`Record physical inventory adjustment for SKU: ${selectedItem?.product_name} at ${selectedItem?.warehouse_name}`}
      >
        {selectedItem && (
          <form onSubmit={handleStockAction} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Facility Stock:</span>
                <span className="font-mono font-bold text-white">{selectedItem.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reorder Threshold:</span>
                <span className="font-mono text-slate-300">{selectedItem.reorder_level} units</span>
              </div>
            </div>

            <Input
              label={`Quantity to ${modalAction}`}
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white"
            />

            <Input
              label="Transaction Remarks / Reason"
              value={adjustRemarks}
              onChange={(e) => setAdjustRemarks(e.target.value)}
              placeholder="e.g. Inward consignment from vendor or dispatch verification"
              className="bg-slate-950 border-slate-800 text-white"
            />

            <div className="pt-4 flex justify-end space-x-3">
              <Button type="button" variant="ghost" onClick={() => setModalAction(null)} className="text-slate-400">
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                className={modalAction === 'IN' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}
              >
                Confirm Stock {modalAction}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading Inventory...</p>
        </div>
      }
    >
      <AdminInventoryContent />
    </React.Suspense>
  );
}
