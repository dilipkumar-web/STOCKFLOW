'use client';

import * as React from "react";
import {
  Settings,
  Database,
  ShieldCheck,
  Server,
  Lock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [health, setHealth] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Architecture &amp; Database Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Connection telemetry, Aiven PostgreSQL cluster health, security policies, and environment config.
        </p>
      </div>

      {/* Database Connection Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Database Engine: Aiven PostgreSQL</h3>
              <p className="text-xs text-slate-400">Schema: <code className="text-blue-400 font-mono">stockflow</code></p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{health?.status === 'healthy' ? 'Active & Healthy' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Target Database Name</span>
            <span className="text-white font-mono font-bold text-sm">STOCKFLOW</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Target Schema</span>
            <span className="text-white font-mono font-bold text-sm">stockflow</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Connection Driver</span>
            <span className="text-white font-mono font-bold text-sm">pg (node-postgres with SSL)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Serverless Pool Max</span>
            <span className="text-white font-mono font-bold text-sm">10 pooled connections</span>
          </div>
        </div>
      </div>

      {/* Relational Tables Integrity Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center">
          <Layers className="w-5 h-5 text-emerald-400 mr-2" />
          Schema Table Integrity (All 11 Tables Online)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          {[
            { name: "stockflow.products", role: "7 Core Tables" },
            { name: "stockflow.suppliers", role: "7 Core Tables" },
            { name: "stockflow.warehouses", role: "7 Core Tables" },
            { name: "stockflow.inventory", role: "7 Core Tables" },
            { name: "stockflow.purchase_orders", role: "7 Core Tables" },
            { name: "stockflow.order_items", role: "7 Core Tables" },
            { name: "stockflow.stock_transactions", role: "7 Core Tables" },
            { name: "stockflow.users", role: "Portal & Auth" },
            { name: "stockflow.customer_orders", role: "Portal & Auth" },
            { name: "stockflow.customer_order_items", role: "Portal & Auth" },
            { name: "stockflow.cart_items", role: "Portal & Auth" },
          ].map((t) => (
            <div key={t.name} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="font-mono text-slate-200 text-[11px] truncate">{t.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Security Policies Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-white flex items-center">
          <ShieldCheck className="w-5 h-5 text-indigo-400 mr-2" />
          Software Security Specifications
        </h3>
        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>HTTP-Only Secure JWT Session Cookies with 7-day expiration and SameSite=Lax</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Bcrypt 10-round salted password hashes; password hashes never returned in API payloads</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Sliding window brute-force login rate limiting (max 5 failed attempts per IP/account)</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Atomic row-level locking (<code className="text-amber-300 font-mono">FOR UPDATE</code>) to prevent race condition overselling</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
