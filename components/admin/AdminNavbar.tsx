'use client';

import * as React from "react";
import Link from "next/link";
import { Database, ShieldCheck, ExternalLink, Menu } from "lucide-react";

interface AdminNavbarProps {
  onToggleSidebar?: () => void;
  pageTitle?: string;
}

export function AdminNavbar({ onToggleSidebar, pageTitle = "Dashboard" }: AdminNavbarProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-white tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Database Status Indicator */}
        <div className="hidden sm:inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5" />
          <span>Aiven PostgreSQL Connected</span>
        </div>

        {/* View Client Portal Link */}
        <Link
          href="/client/dashboard"
          target="_blank"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <span>Client Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
