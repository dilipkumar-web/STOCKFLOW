'use client';

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Search,
  Filter,
  ShoppingCart,
  Eye,
  Check,
} from "lucide-react";
import { formatCurrency, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function ClientProductsCatalogContent() {
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [products, setProducts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState(initialCategory);
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [sortBy, setSortBy] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState("asc");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Quantities for each card
  const [quantities, setQuantities] = React.useState<{ [key: string]: number }>({});

  // Details modal
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);

  const fetchCatalog = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        category: selectedCategory === 'All' ? '' : selectedCategory,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: "12",
      });
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const res = await fetch(`/api/client/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        setCategories(json.categories);
        setTotalPages(json.meta?.totalPages || 1);
      }
    } catch {
      error("Failed to load catalog products");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, minPrice, maxPrice, sortBy, sortOrder, page, error]);

  React.useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleQuantityChange = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, val),
    }));
  };

  const handleAddToCart = async (product: any) => {
    const qty = quantities[product.product_id] || 1;
    try {
      const res = await fetch('/api/client/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.product_id,
          quantity: qty,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add item to cart');

      success(`Added ${qty}x "${product.name}" to cart!`);
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Product Catalogue</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Browse certified supplies, check live warehouse availability, and place orders with Indian Rupee (₹) pricing.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sorting */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading catalog items...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            No products found matching your search.
          </div>
        ) : (
          products.map((p) => {
            const badge = getStatusBadgeStyle(p.stock_status);
            const currentQty = quantities[p.product_id] || 1;
            return (
              <div
                key={p.product_id}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Card Placeholder Illustration */}
                  <div className="w-full h-40 rounded-xl bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden mb-3">
                    <Package className="w-12 h-12 text-slate-400 group-hover:scale-105 transition-transform" />
                    <span className="text-[10px] font-mono font-bold text-slate-500 mt-2 tracking-wider uppercase">
                      {p.category}
                    </span>
                    <span className="absolute top-2.5 right-2.5 font-mono text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-850 font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      {p.product_id}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {p.name}
                  </h3>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {p.stock_status}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500 font-mono">
                    Available: {p.available_stock} units
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {/* Quantity selector */}
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={p.available_stock <= 0 || currentQty <= 1}
                      onClick={() => handleQuantityChange(p.product_id, currentQty - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {currentQty}
                    </span>
                    <button
                      disabled={p.available_stock <= 0 || currentQty >= p.available_stock}
                      onClick={() => handleQuantityChange(p.product_id, currentQty + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    >
                      +
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedProduct(p)}
                      className="ml-auto text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Add to Cart button */}
                  <Button
                    size="sm"
                    disabled={p.available_stock <= 0}
                    onClick={() => handleAddToCart(p)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 shadow-sm shadow-emerald-500/10"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="text-xs"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Product Details Modal */}
      <Modal isOpen={selectedProduct !== null} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name}>
        {selectedProduct && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
              <Package className="w-14 h-14 text-emerald-500 mb-2" />
              <span className="font-mono text-xs font-bold text-slate-500">{selectedProduct.product_id}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Category</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedProduct.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Unit Price (INR)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(selectedProduct.price)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Available Stock</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {selectedProduct.available_stock} units
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-bold text-emerald-500">{selectedProduct.stock_status}</span>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              disabled={selectedProduct.available_stock <= 0}
              onClick={() => {
                handleAddToCart(selectedProduct);
                setSelectedProduct(null);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Shopping Cart
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function ClientProductsCatalogPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading Product Catalog...</p>
        </div>
      }
    >
      <ClientProductsCatalogContent />
    </React.Suspense>
  );
}
