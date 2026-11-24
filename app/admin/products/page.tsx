'use client';

import * as React from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate, exportToCSV, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function AdminProductsPage() {
  const { success, error } = useToast();
  const [products, setProducts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [sortBy, setSortBy] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState("asc");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    product_id: "",
    name: "",
    category: "",
    price: "",
    reorder_level: "10",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        category,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/admin/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        setCategories(json.categories);
        setTotalPages(json.meta?.totalPages || 1);
      }
    } catch {
      error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, sortOrder, page, error]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create product');
      }
      success('Product added successfully!');
      setIsAddOpen(false);
      setFormData({ product_id: '', name: '', category: '', price: '', reorder_level: '10' });
      fetchProducts();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update product');
      }
      success('Product updated successfully!');
      setIsEditOpen(false);
      fetchProducts();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm(`Are you sure you want to delete product "${prodId}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${prodId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete product');
      }
      success('Product deleted successfully');
      fetchProducts();
    } catch (err: any) {
      error(err.message);
    }
  };

  const openEditModal = (prod: any) => {
    setSelectedProduct(prod);
    setFormData({
      product_id: prod.product_id,
      name: prod.name,
      category: prod.category,
      price: prod.price.toString(),
      reorder_level: prod.reorder_level.toString(),
    });
    setIsEditOpen(true);
  };

  const openDetailsModal = async (prod: any) => {
    try {
      const res = await fetch(`/api/admin/products/${prod.product_id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedProduct(json.data);
        setIsDetailsOpen(true);
      }
    } catch {
      error("Failed to load product details");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Product Catalog Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain master SKUs, unit prices, reorder thresholds, and warehouse storage locations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_products", products)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormData({ product_id: '', name: '', category: '', price: '', reorder_level: '10' });
              setIsAddOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="stock_desc">Highest Stock</option>
            <option value="stock_asc">Lowest Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">SKU / ID</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Reorder Min</th>
                <th className="py-3 px-4">Total Stock</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const badge = getStatusBadgeStyle(p.stock_status);
                  return (
                    <tr key={p.product_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {p.product_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white max-w-[200px] truncate">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {p.reorder_level} units
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {p.total_stock}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {p.stock_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openDetailsModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.product_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="border-slate-800 text-slate-300"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="border-slate-800 text-slate-300"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Product to Database">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product SKU / ID (Optional - Auto-generated if blank)"
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
            placeholder="e.g. PRD-1001"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Product Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Industrial Barcode Scanner"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g. Hardware, Packaging, Electronics"
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Price (INR ₹)"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. 1499.00"
              className="bg-slate-950 border-slate-800 text-white"
            />
            <Input
              label="Reorder Threshold"
              type="number"
              required
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              placeholder="10"
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Product: ${formData.product_id}`}>
        <form onSubmit={handleEditProduct} className="space-y-4">
          <Input
            label="Product Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Input
            label="Category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Price (INR ₹)"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="bg-slate-950 border-slate-800 text-white"
            />
            <Input
              label="Reorder Threshold"
              type="number"
              required
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Update Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Details & Warehouse Breakdown Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={`Product Breakdown: ${selectedProduct?.name}`}>
        {selectedProduct && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Product SKU</span>
                <span className="font-mono text-blue-400 font-bold">{selectedProduct.product_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="text-white font-medium">{selectedProduct.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Unit Price</span>
                <span className="text-white font-semibold">{formatCurrency(selectedProduct.price)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Inventory Stock</span>
                <span className="text-white font-bold font-mono">{selectedProduct.total_stock} units</span>
              </div>
            </div>

            <h4 className="font-bold text-white text-sm pt-2">Warehouse Storage Allocations</h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Warehouse</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {selectedProduct.warehouses && selectedProduct.warehouses.length > 0 ? (
                    selectedProduct.warehouses.map((wh: any) => (
                      <tr key={wh.warehouse_id}>
                        <td className="p-2.5 font-semibold text-white">{wh.warehouse_name}</td>
                        <td className="p-2.5 text-slate-400">{wh.location}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-400">{wh.quantity}</td>
                        <td className="p-2.5 text-slate-500">{formatDate(wh.last_updated, true)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">
                        No warehouse has active stock for this SKU yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
