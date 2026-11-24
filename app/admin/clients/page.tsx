'use client';

import * as React from "react";
import {
  Users,
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency, formatDate, exportToCSV, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function AdminClientsPage() {
  const { success, error } = useToast();
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchClients = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/clients?${params}`);
      const json = await res.json();
      if (json.success) {
        setClients(json.data);
      }
    } catch {
      error("Failed to load registered clients");
    } finally {
      setLoading(false);
    }
  }, [search, error]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const toggleClientStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountStatus: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update client status');
      success(json.message);
      fetchClients();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Registered Client Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Oversee B2B and retail customer accounts, purchase totals, and access authorization statuses.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_clients", clients)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export Clients CSV
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by client name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Total Procurement Spend</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading registered clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No client accounts found. Clients register via the public client portal.
                  </td>
                </tr>
              ) : (
                clients.map((c) => {
                  const badge = getStatusBadgeStyle(c.account_status);
                  return (
                    <tr key={c.user_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {c.user_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {c.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {c.email}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {c.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {c.total_orders || 0} orders
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {formatCurrency(c.total_spent)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(c.created_at, false)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {c.account_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleClientStatus(c.user_id, c.account_status)}
                          className={c.account_status === 'active' ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs h-7 px-2.5' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-7 px-2.5'}
                        >
                          {c.account_status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
