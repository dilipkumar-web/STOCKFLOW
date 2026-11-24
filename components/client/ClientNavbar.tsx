'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ShoppingBag,
  ShoppingCart,
  User,
  LogOut,
  Package,
  Layers,
  MapPin,
  Menu,
  X,
} from "lucide-react";

export function ClientNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [cartCount, setCartCount] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const fetchProfileAndCart = React.useCallback(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    fetch('/api/client/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCartCount(data.data.totalItems || 0);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetchProfileAndCart();
    // Poll cart changes every 10 seconds or on window focus
    const interval = setInterval(fetchProfileAndCart, 10000);
    window.addEventListener('focus', fetchProfileAndCart);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchProfileAndCart);
    };
  }, [fetchProfileAndCart]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('stockflow_client_user');
      localStorage.removeItem('stockflow_token');
    } catch (_) {}
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/client/login';
  };

  const navLinks = [
    { name: "Dashboard", href: "/client/dashboard" },
    { name: "Browse Products", href: "/client/products" },
    { name: "My Orders", href: "/client/orders" },
    { name: "Order Tracking", href: "/client/tracking" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/client/dashboard" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
                STOCK<span className="text-emerald-500">FLOW</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase block -mt-1">
                Client Store
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors py-1 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Cart & Profile */}
        <div className="flex items-center space-x-3">
          {/* Shopping Cart Button */}
          <Link
            href="/client/cart"
            className="relative p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-scale">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Profile link */}
          <Link
            href="/client/profile"
            className="hidden sm:flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
              {user?.full_name?.split(' ')[0] || 'Client'}
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-950">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/client/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            My Profile
          </Link>
        </div>
      )}
    </header>
  );
}
