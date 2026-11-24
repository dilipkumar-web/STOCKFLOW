'use client';

import * as React from "react";
import {
  BarChart3,
  Download,
  Layers,
  AlertTriangle,
  Warehouse,
  Truck,
  TrendingUp,
  DollarSign,
  Award,
} from "lucide-react";
import { formatCurrency, formatDate, exportToCSV } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function AdminReportsPage() {
  const { error } = useToast();
  const [activeTab, setActiveTab] = React.useState("valuation");
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchReport = React.useCallback(async (type: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reports?type=${type}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch {
      error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const reportTabs = [
    { id: "valuation", name: "Inventory Valuation", icon: DollarSign },
    { id: "low_stock", name: "Low-Stock Alert", icon: AlertTriangle },
    { id: "warehouse_utilization", name: "Warehouse Utilization", icon: Warehouse },
    { id: "supplier_purchases", name: "Supplier Procurement", icon: Truck },
    { id: "stock_movements", name: "Stock Movement Audit", icon: TrendingUp },
    { id: "best_sellers", name: "Best-Selling SKUs", icon: Award },
    { id: "sales_performance", name: "Sales Performance", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Intelligence &amp; Analytics Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            SQL aggregate queries, GROUP BY metrics, and operational performance reports with instant CSV exports.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            onClick={() => exportToCSV(`stockflow_report_${activeTab}`, reportData)}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Download Current Report (CSV)
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto space-x-2 pb-1 border-b border-slate-800">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Report Table Display */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Aggregating live report metrics from PostgreSQL...
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No data records found for this report.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="py-3 px-4 whitespace-nowrap">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    {Object.entries(row).map(([k, v]: [string, any], colIdx) => (
                      <td key={colIdx} className="py-3.5 px-4 whitespace-nowrap">
                        {k.includes('price') || k.includes('valuation') || k.includes('cost') || k.includes('amount') || k.includes('value') || k.includes('revenue')
                          ? formatCurrency(v)
                          : k.includes('time') || k.includes('date')
                          ? formatDate(v, true)
                          : String(v ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
