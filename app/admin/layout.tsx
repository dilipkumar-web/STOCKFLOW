'use client';

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const isLoginPage = pathname === '/admin/login';

  React.useEffect(() => {
    // If on admin login page, never block or check layout authentication
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    // Check localStorage fallback first for instant client-side rendering
    const localUser = typeof window !== 'undefined' ? localStorage.getItem('stockflow_admin_user') : null;
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        if (parsed.role === 'admin') {
          setIsAuthenticated(true);
        }
      } catch (_) {}
    }

    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then((data) => {
        if (!data.user || data.user.role !== 'admin') {
          if (!localUser) {
            router.push('/admin/login');
          }
        } else {
          setIsAuthenticated(true);
          try {
            localStorage.setItem('stockflow_admin_user', JSON.stringify(data.user));
          } catch (_) {}
        }
      })
      .catch(() => {
        if (!localUser) {
          router.push('/admin/login');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router, isLoginPage, pathname]);

  // Render admin login page directly without sidebar or navbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading && !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Verifying Admin Credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950 text-slate-100">
      <AdminSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminNavbar onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-900/40">{children}</main>
      </div>
    </div>
  );
}
