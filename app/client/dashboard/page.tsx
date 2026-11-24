'use client';

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ShoppingCart,
  Package,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ClientDashboardPage() {
  const { success, error } = useToast();
  const [user, setUser] = React.useState<any>(null);
  const [featuredProducts, setFeaturedProducts] = React.useState<any[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/client/products?limit=6').then((r) => r.json()),
      fetch('/api/client/orders').then((r) => r.json()),
    ])
      .then(([userData, prodData, orderData]) => {
        if (userData.user) setUser(userData.user);
        if (prodData.success) {
          setFeaturedProducts(prodData.data);
          setCategories(prodData.categories || []);
        }
        if (orderData.success) setRecentOrders(orderData.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      const res = await fetch('/api/client/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add item to cart');
      success(`Added "${productName}" to your cart!`);
    } catch (err: any) {
      error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          Loading Client Dashboard...
        </p>
      </div>
    );
  }

  const activeOrdersCount = recentOrders.filter(
    (o) => !['Delivered', 'Cancelled'].includes(o.order_status)
  ).length;

  return (
    <div className="space-y-8">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 sm:p-10 text-white shadow-xl shadow-emerald-600/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Client Procurement Portal</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || 'Valued Client'}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100 font-normal leading-relaxed">
            Real-time warehouse stock visibility, instant B2B order dispatch, and persistent cart checkout powered by Aiven PostgreSQL.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/client/products">
              <Button size="sm" className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-md">
                Browse Full Catalog
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/client/cart">
              <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold">
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                View Shopping Cart
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Lifetime Orders</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {recentOrders.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Active In-Flight Orders</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {activeOrdersCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Order Tracking</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              Live Fulfillment
            </p>
          </div>
          <Link href="/client/tracking">
            <Button size="sm" variant="outline" className="border-slate-300 dark:border-slate-700 text-xs">
              Track Status →
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Shop by Product Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link key={cat} href={`/client/products?category=${encodeURIComponent(cat)}`}>
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-sm">
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Featured In-Stock Products</h3>
            <p className="text-xs text-slate-500">Live availability synchronized across warehouse nodes</p>
          </div>
          <Link href="/client/products" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">
            View All ({featuredProducts.length}+) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredProducts.map((p) => {
            const badge = getStatusBadgeStyle(p.stock_status);
            return (
              <div
                key={p.product_id}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Placeholder Graphic */}
                  <div className="w-full h-36 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden mb-4">
                    <Package className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-mono font-bold text-slate-500 mt-2 uppercase tracking-wider">
                      {p.category}
                    </span>
                    <span className="absolute top-2.5 right-2.5 font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 font-bold text-slate-600 dark:text-slate-300">
                      {p.product_id}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {p.name}
                  </h4>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {p.stock_status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {p.available_stock} in stock
                  </span>
                  <Button
                    size="sm"
                    disabled={p.available_stock <= 0}
                    onClick={() => handleAddToCart(p.product_id, p.name)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Section */}
      {recentOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Purchases</h3>
            <Link href="/client/orders" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">
              Order History →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {recentOrders.slice(0, 4).map((ord) => {
                  const badge = getStatusBadgeStyle(ord.order_status);
                  return (
                    <tr key={ord.customer_order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ord.customer_order_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(ord.order_date, false)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(ord.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href="/client/tracking">
                          <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-emerald-600">
                            Track
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
