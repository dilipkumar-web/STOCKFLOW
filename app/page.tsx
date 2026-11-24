import Link from "next/link";
import {
  Boxes,
  ShieldCheck,
  TrendingUp,
  Warehouse,
  ArrowRight,
  Database,
  Lock,
  Layers,
  CheckCircle2,
  Cpu,
  BarChart3,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center">
                STOCK<span className="text-blue-500">FLOW</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono tracking-widest uppercase block -mt-1">
                Supply Chain OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-blue-400 transition-colors">
              Architecture
            </a>
            <a href="#database" className="hover:text-blue-400 transition-colors">
              Database
            </a>
            <a href="#portals" className="hover:text-blue-400 transition-colors">
              Dual Portals
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/client/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                Client Sign In
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/25">
                Admin Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10">
        <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Inventory &amp; Supply Chain Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
            Smarter Inventory. <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Seamless Supply Chains.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
            STOCKFLOW is an integrated inventory operations platform combining real-time multi-warehouse tracking, 
            automated purchase ordering, B2B client procurement, and ACID-compliant stock allocations on Aiven PostgreSQL.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" id="portals">
            <Link href="/admin/login" className="w-full sm:w-auto">
              <div className="group relative rounded-xl p-[1px] bg-gradient-to-r from-blue-500 to-indigo-500">
                <div className="px-8 py-3.5 rounded-xl bg-slate-900 group-hover:bg-slate-900/80 transition-all flex items-center justify-center space-x-3 text-white font-semibold shadow-xl">
                  <Warehouse className="w-5 h-5 text-blue-400" />
                  <span>Launch Admin Portal</span>
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/client/login" className="w-full sm:w-auto">
              <div className="px-8 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center space-x-3 text-white font-semibold">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span>Open Client Store</span>
              </div>
            </Link>

            <Link href="/client/register" className="w-full sm:w-auto">
              <div className="px-8 py-3.5 rounded-xl bg-transparent hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center space-x-2 text-slate-300 font-medium">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Client Registration</span>
              </div>
            </Link>
          </div>

          {/* Metric Badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <p className="text-xs text-slate-400 font-medium">Architecture</p>
              <p className="text-xl font-bold text-white mt-1">Dual Interface</p>
              <p className="text-xs text-blue-400 mt-1">Admin + Client Portal</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <p className="text-xs text-slate-400 font-medium">Database Engine</p>
              <p className="text-xl font-bold text-white mt-1">Aiven PostgreSQL</p>
              <p className="text-xs text-emerald-400 mt-1">11 Normalized Tables</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <p className="text-xs text-slate-400 font-medium">Transactions</p>
              <p className="text-xl font-bold text-white mt-1">Row-Lock ACID</p>
              <p className="text-xs text-teal-400 mt-1">Zero Overselling</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <p className="text-xs text-slate-400 font-medium">Security</p>
              <p className="text-xl font-bold text-white mt-1">HTTP-Only JWT</p>
              <p className="text-xs text-indigo-400 mt-1">Bcrypt Hash + RBAC</p>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-2">Core Capabilities</h2>
              <p className="text-3xl sm:text-4xl font-bold text-white">Engineered for End-to-End Precision</p>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                From purchase order creation and warehouse inward receipts to client checkout and audit trails.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-5">
                  <Warehouse className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Multi-Warehouse Allocation</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Track stock across multiple regional warehouses with real-time capacity utilization gauges and cross-facility transfers.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Automated Purchase Orders</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Generate POs for authorized suppliers. Receive orders with single-click atomic stock increments and auto-logged IN transactions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-5">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Modern Client Commerce</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  B2B ordering with persistent PostgreSQL carts, Indian Rupee pricing, live stock availability, and visual order tracking.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Zero-Overselling Concurrency</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Row-level database locks (<code className="text-xs text-amber-300">FOR UPDATE</code>) prevent race conditions when multiple orders occur simultaneously.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center mb-5">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Executive Analytics &amp; CSV</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Visual breakdown of inventory valuation, warehouse utilization, order velocity, low stock alerts, and instant CSV downloads.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-5">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Immutable Stock Audit Trail</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Every inventory addition, subtraction, transfer, or order cancellation produces an indelible record in stock_transactions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Database Architecture Section */}
        <section id="database" className="py-20 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs uppercase tracking-widest text-teal-400 font-bold mb-2">Relational Architecture</h2>
              <p className="text-3xl sm:text-4xl font-bold text-white">Aiven PostgreSQL Schema Design</p>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                Preserves all 7 core operational tables and extends cleanly with 4 portal tables.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Existing 7 Core Tables */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Database className="w-4 h-4 text-blue-400 mr-2" />
                    7 Core Supply Chain Tables
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 font-mono">
                    stockflow schema
                  </span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-blue-300">stockflow.products</span>
                    <span className="text-slate-400 text-xs">SKUs, categories, reorder levels</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-blue-300">stockflow.suppliers</span>
                    <span className="text-slate-400 text-xs">Vendors, contacts, company profiles</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-blue-300">stockflow.warehouses</span>
                    <span className="text-slate-400 text-xs">Locations, maximum storage capacities</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-blue-300">stockflow.inventory</span>
                    <span className="text-slate-400 text-xs">Compound unique (product_id, warehouse_id)</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-blue-300">stockflow.purchase_orders</span>
                    <span className="text-slate-400 text-xs">Supplier orders, status lifecycle</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-blue-300">stockflow.order_items</span>
                    <span className="text-slate-400 text-xs">PO product line items &amp; unit prices</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-blue-300">stockflow.stock_transactions</span>
                    <span className="text-slate-400 text-xs">Audit log: IN, OUT, TRANSFER</span>
                  </li>
                </ul>
              </div>

              {/* 4 Additional Portal Tables */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Users className="w-4 h-4 text-emerald-400 mr-2" />
                    4 Client Portal &amp; Auth Tables
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    client_portal_setup.sql
                  </span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-emerald-300">stockflow.users</span>
                    <span className="text-slate-400 text-xs">RBAC (admin / client), bcrypt hashes</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-emerald-300">stockflow.customer_orders</span>
                    <span className="text-slate-400 text-xs">B2B client checkout, status timeline</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-emerald-300">stockflow.customer_order_items</span>
                    <span className="text-slate-400 text-xs">Customer line items, unit prices, totals</span>
                  </li>
                  <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                    <span className="font-mono text-emerald-300">stockflow.cart_items</span>
                    <span className="text-slate-400 text-xs">Persistent server-side user shopping cart</span>
                  </li>
                </ul>
                <div className="mt-6 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 inline-block mr-1.5 text-emerald-400" />
                  Idempotent SQL migration file provided in <code className="font-mono text-white">database/client_portal_setup.sql</code>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-white">
              STOCK<span className="text-blue-500">FLOW</span>
            </span>
            <span className="text-xs text-slate-500 pl-2 border-l border-slate-800">
              DBMS Project Implementation
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Powered by Next.js App Router, Aiven PostgreSQL, Tailwind CSS, Lucide React &amp; Recharts.
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <Link href="/admin/login" className="hover:text-white transition-colors">
              Admin Login
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/client/login" className="hover:text-white transition-colors">
              Client Login
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/client/register" className="hover:text-white transition-colors">
              Client Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
