'use client';

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@stockflow.com");
  const [password, setPassword] = React.useState("Admin@123456");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
        body: JSON.stringify({ email, password, requestedRole: "admin" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Admin authentication failed. Please check your credentials.");
        return;
      }

      if (data.user) {
        try {
          localStorage.setItem('stockflow_admin_user', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('stockflow_token', data.token);
        } catch (_) {}
      }
      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      setError(err?.message || "An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top Brand Link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              STOCK<span className="text-blue-500">FLOW</span>
            </span>
          </Link>
          <h2 className="text-lg font-bold text-slate-100 mt-4">Administrator Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted access for system administrators &amp; inventory controllers.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl">
          {/* Quick Demo Fill */}
          <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-400 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Quick Demo Fill:
              </span>
              <button
                type="button"
                onClick={fillAdminDemo}
                className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition shadow-sm"
              >
                Reset to Default Admin
              </button>
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>Email: <code className="text-blue-300 font-mono">admin@stockflow.com</code></div>
              <div>Password: <code className="text-blue-300 font-mono">Admin@123456</code> (or <code className="text-blue-300 font-mono">admin123</code>)</div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Admin Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stockflow.com"
                className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-blue-500"
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
                className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 mt-2"
              isLoading={isLoading}
            >
              Sign In to Admin Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Setup Script Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center text-slate-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
              Initial Admin Setup Command:
            </div>
            <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto">
              npm run create-admin
            </pre>
            <p className="text-[11px] text-slate-500">
              Admin accounts cannot be created via public registration.
            </p>
          </div>
        </div>

        {/* Back to Home & Client Login */}
        <div className="mt-6 text-center space-x-4 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Home
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/client/login" className="hover:text-blue-400 transition-colors">
            Switch to Client Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
