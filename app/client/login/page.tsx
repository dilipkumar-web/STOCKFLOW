'use client';

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, ShieldAlert, KeyRound, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("client@stockflow.com");
  const [password, setPassword] = React.useState("Client@123");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fillClientDemo = () => {
    setEmail("client@stockflow.com");
    setPassword("Client@123");
    setError(null);
  };

  const fillAdminDemo = () => {
    setEmail("admin@stockflow.com");
    setPassword("Admin@123456");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, requestedRole: "client" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Login failed. Please verify your email and password.");
        return;
      }

      if (data.user) {
        const role = data.user.role;
        try {
          if (role === 'admin') {
            localStorage.setItem('stockflow_admin_user', JSON.stringify(data.user));
          } else {
            localStorage.setItem('stockflow_client_user', JSON.stringify(data.user));
          }
          if (data.token) localStorage.setItem('stockflow_token', data.token);
        } catch (_) {}
        window.location.href = role === 'admin' ? "/admin/dashboard" : "/client/dashboard";
      } else {
        window.location.href = "/client/dashboard";
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              STOCK<span className="text-emerald-500">FLOW</span>
            </span>
          </Link>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-3">Client Purchasing Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in to browse products, manage carts and track orders.
          </p>
        </div>

        {/* Demo Quick-Fill Pill Bar */}
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Quick Demo Fill:
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillClientDemo}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition shadow-sm text-center"
            >
              Fill Demo Client
            </button>
            <button
              type="button"
              onClick={fillAdminDemo}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition shadow-sm text-center"
            >
              Fill Demo Admin
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
            <div>• Client: <code className="text-emerald-600 dark:text-emerald-400 font-mono">client@stockflow.com</code> / <code className="text-emerald-600 dark:text-emerald-400 font-mono">Client@123</code></div>
            <div>• Admin: <code className="text-blue-600 dark:text-blue-400 font-mono">admin@stockflow.com</code> / <code className="text-blue-600 dark:text-blue-400 font-mono">Admin@123456</code></div>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@stockflow.com"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 mt-2"
              isLoading={isLoading}
            >
              Sign In to Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Don&apos;t have a client account?{" "}
            <Link href="/client/register" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 text-center space-x-4 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-700 dark:hover:text-white transition-colors">
            ← Home
          </Link>
          <span>•</span>
          <Link href="/admin/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Administrator Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
