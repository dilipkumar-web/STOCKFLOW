import Link from "next/link";
import { Boxes, ShieldCheck, ShoppingBag } from "lucide-react";

export function ClientFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white">
            STOCK<span className="text-emerald-500">FLOW</span> Client Portal
          </span>
        </div>

        <div className="text-xs text-slate-500">
          Cash on Delivery (COD) default checkout. Direct inventory allocation from Aiven PostgreSQL.
        </div>

        <div className="flex items-center space-x-4 text-xs text-slate-500">
          <Link href="/client/dashboard" className="hover:text-emerald-600 transition-colors">
            Store
          </Link>
          <span>•</span>
          <Link href="/client/orders" className="hover:text-emerald-600 transition-colors">
            Orders
          </Link>
          <span>•</span>
          <Link href="/client/tracking" className="hover:text-emerald-600 transition-colors">
            Tracking
          </Link>
          <span>•</span>
          <Link href="/admin/login" className="hover:text-blue-600 transition-colors">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
