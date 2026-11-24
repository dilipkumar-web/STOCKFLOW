'use client';

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  IndianRupee,
  Truck,
  Warehouse,
  ClipboardList,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency, formatDate, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Calculating Real-time PostgreSQL Analytics...
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: data?.totalProducts ?? 0,
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/admin/products",
    },
    {
      title: "Total Stock Units",
      value: (data?.totalStockQuantity ?? 0).toLocaleString(),
      icon: Layers,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/admin/inventory",
    },
    {
      title: "Inventory Valuation",
      value: formatCurrency(data?.totalInventoryValue ?? 0),
      icon: IndianRupee,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20",
      href: "/admin/reports",
    },
    {
      title: "Suppliers",
      value: data?.totalSuppliers ?? 0,
      icon: Truck,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      href: "/admin/suppliers",
    },
    {
      title: "Warehouses",
      value: data?.totalWarehouses ?? 0,
      icon: Warehouse,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      href: "/admin/warehouses",
    },
    {
      title: "Pending POs",
      value: data?.pendingPurchaseOrders ?? 0,
      icon: ClipboardList,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      href: "/admin/purchase-orders",
    },
    {
      title: "Customer Orders",
      value: data?.totalCustomerOrders ?? 0,
      icon: ShoppingBag,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      href: "/admin/customer-orders",
    },
    {
      title: "Low Stock Items",
      value: data?.lowStockCount ?? 0,
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      href: "/admin/inventory?lowStock=true",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Operations Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time supply chain health aggregated from Aiven PostgreSQL schema <code className="text-blue-400 font-mono">stockflow</code>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={refreshing}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh Metrics
          </Button>
          <Link href="/admin/purchase-orders">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20">
              + New Purchase Order
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="group">
              <div className={`p-4 rounded-2xl bg-slate-950/80 border ${card.border} hover:border-slate-700 transition-all shadow-sm`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{card.value}</p>
                  <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Low Stock Alert Banner if items exist */}
      {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Action Required: {data.lowStockProducts.length} Product(s) Below Reorder Level
              </h4>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Total warehouse stock has dipped at or below minimum threshold. Review restocking requirements immediately.
              </p>
            </div>
          </div>
          <Link href="/admin/inventory?lowStock=true">
            <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs">
              View Low Stock Items
            </Button>
          </Link>
        </div>
      )}

      {/* Row 1 Charts: Stock Movements & Warehouse Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Movements Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Stock Movement Dynamics</h3>
              <p className="text-xs text-slate-400">Daily Inward (IN), Outward (OUT), and Transfers (Past 14 Days)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts?.stockMovements || []}>
                <defs>
                  <linearGradient id="inColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="inQty" stroke="#10b981" fillOpacity={1} fill="url(#inColor)" name="Inward (IN)" />
                <Area type="monotone" dataKey="outQty" stroke="#ef4444" fillOpacity={1} fill="url(#outColor)" name="Outward (OUT)" />
                <Area type="monotone" dataKey="transferQty" stroke="#3b82f6" fill="transparent" name="Transfer" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Capacity Utilization */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Warehouse Space Utilization</h3>
            <p className="text-xs text-slate-400 mb-4">Capacity consumption across regional facilities</p>

            <div className="space-y-4">
              {data?.charts?.warehouseUtilization?.map((wh: any) => (
                <div key={wh.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{wh.name}</span>
                    <span className="font-mono text-slate-400">
                      {wh.current} / {wh.capacity} ({wh.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        wh.percentage > 85 ? 'bg-rose-500' : wh.percentage > 60 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, wh.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/admin/warehouses" className="mt-4 pt-3 border-t border-slate-800 text-xs text-blue-400 hover:text-blue-300 flex items-center justify-between">
            <span>Manage Warehouses</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Row 2 Charts: Inventory by Warehouse & Products by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Distribution by Warehouse Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-white mb-1">Inventory by Facility</h3>
          <p className="text-xs text-slate-400 mb-4">Total stock quantity stored per warehouse</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.inventoryByWarehouse || []}>
                <XAxis dataKey="warehouse" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Units Stored" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-white mb-1">Stock by Product Category</h3>
          <p className="text-xs text-slate-400 mb-4">Volume distribution across categories</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.productsByCategory || []} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="stock" fill="#10b981" radius={[0, 6, 6, 0]} name="Units in Stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Transactions & Recent Customer Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions Table */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Stock Transactions</h3>
              <p className="text-xs text-slate-400">Live immutable PostgreSQL audit records</p>
            </div>
            <Link href="/admin/stock-transactions" className="text-xs text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data?.recentTransactions?.map((tx: any) => {
                  const badge = getStatusBadgeStyle(tx.transaction_type);
                  return (
                    <tr key={tx.transaction_id} className="hover:bg-slate-900/50">
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-white max-w-[150px] truncate">
                        {tx.product_name || tx.product_id}
                      </td>
                      <td className="py-2.5 font-mono font-semibold">{tx.quantity}</td>
                      <td className="py-2.5 text-slate-400">{formatDate(tx.transaction_time, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Customer Orders Table */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Customer Orders</h3>
              <p className="text-xs text-slate-400">B2B client procurement activity</p>
            </div>
            <Link href="/admin/customer-orders" className="text-xs text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data?.recentCustomerOrders && data.recentCustomerOrders.length > 0 ? (
                  data.recentCustomerOrders.map((ord: any) => {
                    const badge = getStatusBadgeStyle(ord.order_status);
                    return (
                      <tr key={ord.customer_order_id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 font-mono text-blue-400 font-semibold">
                          {ord.customer_order_id}
                        </td>
                        <td className="py-2.5 text-slate-200 truncate max-w-[120px]">
                          {ord.full_name || ord.user_id}
                        </td>
                        <td className="py-2.5 font-semibold text-white">
                          {formatCurrency(ord.total_amount)}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {ord.order_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No customer orders placed yet. Orders placed by clients appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
