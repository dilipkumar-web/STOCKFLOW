'use client';

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ClientNavbar } from "@/components/client/ClientNavbar";
import { ClientFooter } from "@/components/client/ClientFooter";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const isAuthPage = pathname === '/client/login' || pathname === '/client/register';
  const isPublicPage = pathname === '/client/products' || pathname === '/client/categories';

  React.useEffect(() => {
    // Never block auth pages or public catalog pages
    if (isAuthPage || isPublicPage) {
      setIsLoading(false);
      return;
    }

    // Check localStorage fallback first
    const localUser = typeof window !== 'undefined' ? localStorage.getItem('stockflow_client_user') : null;
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        if (parsed.user_id) {
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
        if (!data.user) {
          if (!localUser) {
            router.push('/client/login');
          }
        } else {
          setIsAuthenticated(true);
          try {
            localStorage.setItem('stockflow_client_user', JSON.stringify(data.user));
          } catch (_) {}
        }
      })
      .catch(() => {
        if (!localUser) {
          router.push('/client/login');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router, isAuthPage, isPublicPage, pathname]);

  // Auth pages render without standard navbar/footer wrapper
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Public catalog pages render with navbar & footer even if guest
  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ClientNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <ClientFooter />
      </div>
    );
  }

  if (isLoading && !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading Client Portal...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ClientNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <ClientFooter />
    </div>
  );
}
