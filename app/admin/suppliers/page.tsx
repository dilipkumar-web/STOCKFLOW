'use client';

import * as React from "react";
import {
  Truck,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { exportToCSV } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function AdminSuppliersPage() {
  const { success, error } = useToast();
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedSupplier, setSelectedSupplier] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({
    supplier_id: "",
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchSuppliers = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/suppliers?${params}`);
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data);
      }
    } catch {
      error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [search, error]);

  React.useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create supplier');
      success('Supplier added successfully');
      setIsAddOpen(false);
      setFormData({ supplier_id: '', name: '', company: '', phone: '', email: '', address: '' });
      fetchSuppliers();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/suppliers/${selectedSupplier.supplier_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update supplier');
      success('Supplier updated successfully');
      setIsEditOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supId: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${supId}"?`)) return;
    try {
      const res = await fetch(`/api/admin/suppliers/${supId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete supplier');
      success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Supplier &amp; Vendor Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized supply partners, contact profiles, and associated purchase order histories.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_suppliers", suppliers)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormData({ supplier_id: '', name: '', company: '', phone: '', email: '', address: '' });
              setIsAddOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company, contact person or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Supplier Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            No suppliers found matching your query.
          </div>
        ) : (
          suppliers.map((s) => (
            <div
              key={s.supplier_id}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold block">{s.supplier_id}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{s.company}</h3>
                    <p className="text-xs text-slate-400 font-medium">Contact: {s.name}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{s.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>{s.phone || '—'}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
                    <span className="line-clamp-2">{s.address || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center">
                  <ClipboardList className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  {s.orders_count || 0} Purchase Orders
                </span>
                <div className="space-x-1">
                  <button
                    onClick={() => {
                      setSelectedSupplier(s);
                      setFormData({
                        supplier_id: s.supplier_id,
                        name: s.name,
                        company: s.company,
                        phone: s.phone || '',
                        email: s.email,
                        address: s.address || '',
                      });
                      setIsEditOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-900 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(s.supplier_id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Supplier Profile">
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input
            label="Supplier ID (Optional - Auto-generated if blank)"
            value={formData.supplier_id}
            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            placeholder="e.g. SUP-1001"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Company Name"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="e.g. Acme Logistics Pvt Ltd"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Contact Person Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Vikramaditya Singh"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="vendor@company.com"
              className="bg-slate-950 border-slate-800 text-white"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Industrial Estate, Phase 2, Pune"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Supplier: ${formData.company}`}>
        <form onSubmit={handleEditSupplier} className="space-y-4">
          <Input
            label="Company Name"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Contact Person Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-950 border-slate-800 text-white"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Update Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
