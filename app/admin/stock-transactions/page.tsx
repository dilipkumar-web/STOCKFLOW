'use client';

import * as React from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { formatDate, exportToCSV, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function AdminStockTransactionsPage() {
  const { error } = useToast();
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [typeFilter, setTypeFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const fetchTransactions = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/stock-transactions?${params}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data);
      }
    } catch {
      error("Failed to load transactions audit log");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, startDate, endDate, error]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Stock Transaction Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable PostgreSQL historical ledger of all stock movements (IN, OUT, TRANSFER).
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV("stockflow_transactions_log", transactions)}
            className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export Audit CSV
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product, SKU, remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Movement Types</option>
            <option value="IN">IN (Inward)</option>
            <option value="OUT">OUT (Outward)</option>
            <option value="TRANSFER">TRANSFER (Relocation)</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="End Date"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Product SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Source Facility</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4">Units</th>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Audit Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying immutable audit log...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No transaction entries match the current filter.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const badge = getStatusBadgeStyle(t.transaction_type);
                  return (
                    <tr key={t.transaction_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        #{t.transaction_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                        {t.product_id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-[160px] truncate">
                        {t.product_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {t.source_warehouse_name || <span className="text-slate-500 italic">Supplier / Vendor</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {t.destination_warehouse_name || <span className="text-slate-500 italic">Customer Dispatch</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {t.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {formatDate(t.transaction_time, true)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate">
                        {t.remarks || '—'}
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
