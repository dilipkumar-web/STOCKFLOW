'use client';

import * as React from "react";
import {
  Warehouse,
  Plus,
  MapPin,
  Boxes,
  Edit2,
  Trash2,
  Download,
} from "lucide-react";
import { exportToCSV } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function AdminWarehousesPage() {
  const { success, error } = useToast();
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({
    warehouse_id: "",
    name: "",
    location: "",
    capacity: "5000",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchWarehouses = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/warehouses");
      const json = await res.json();
      if (json.success) {
        setWarehouses(json.data);
      }
    } catch {
      error("Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create warehouse');
      success('Warehouse created successfully');
      setIsAddOpen(false);
      setFormData({ warehouse_id: '', name: '', location: '', capacity: '5000' });
      fetchWarehouses();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/warehouses/${selectedWarehouse.warehouse_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update warehouse');
      success('Warehouse updated successfully');
      setIsEditOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWarehouse = async (whId: string) => {
    if (!confirm(`Are you sure you want to delete warehouse "${whId}"?`)) return;
    try {
      const res = await fetch(`/api/admin/warehouses/${whId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete warehouse');
      success('Warehouse deleted successfully');
      fetchWarehouses();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Warehouse Facility Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor spatial capacity utilization, physical storage locations, and active product distributions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_warehouses", warehouses)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormData({ warehouse_id: '', name: '', location: '', capacity: '5000' });
              setIsAddOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading warehouses...
          </div>
        ) : (
          warehouses.map((wh) => (
            <div
              key={wh.warehouse_id}
              className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-400">{wh.warehouse_id}</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{wh.name}</h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{wh.location}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Warehouse className="w-5 h-5" />
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Capacity Utilization</span>
                    <span className="font-mono font-bold text-white">
                      {wh.utilization_percent || 0}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        wh.utilization_percent > 85
                          ? 'bg-rose-500'
                          : wh.utilization_percent > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, wh.utilization_percent || 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
                    <span>Occupied: {wh.current_stock || 0} units</span>
                    <span>Max: {wh.capacity} units</span>
                  </div>
                </div>

                {/* Statistics Row */}
                <div className="mt-5 grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block">Available Headroom</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {wh.available_capacity || 0} units
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Distinct SKUs Stored</span>
                    <span className="text-sm font-bold font-mono text-blue-400">
                      {wh.products_count || 0} products
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedWarehouse(wh);
                    setFormData({
                      warehouse_id: wh.warehouse_id,
                      name: wh.name,
                      location: wh.location,
                      capacity: wh.capacity.toString(),
                    });
                    setIsEditOpen(true);
                  }}
                  className="border-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteWarehouse(wh.warehouse_id)}
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Warehouse Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Warehouse Facility">
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <Input
            label="Warehouse ID (Optional - Auto-generated if blank)"
            value={formData.warehouse_id}
            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            placeholder="e.g. WH-05"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Warehouse Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Central Logistics Hub"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Location / Region"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Mumbai, Maharashtra"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Maximum Capacity (Total Units)"
            type="number"
            required
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            placeholder="5000"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Save Warehouse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Warehouse Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Warehouse: ${formData.name}`}>
        <form onSubmit={handleEditWarehouse} className="space-y-4">
          <Input
            label="Warehouse Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Location / Region"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Maximum Capacity"
            type="number"
            required
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Update Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
