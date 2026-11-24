'use client';

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  Search,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 'Pending', label: 'Pending Confirmation', icon: Clock },
  { id: 'Confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
  { id: 'Processing', label: 'Allocating & Packing', icon: Package },
  { id: 'Shipped', label: 'Out for Delivery', icon: Truck },
  { id: 'Delivered', label: 'Delivered', icon: Home },
];

export default function ClientOrderTrackingPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedOrderId, setSelectedOrderId] = React.useState("");

  React.useEffect(() => {
    fetch('/api/client/orders')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setOrders(json.data);
          setSelectedOrderId(json.data[0].customer_order_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeOrder = orders.find((o) => o.customer_order_id === selectedOrderId) || orders[0];

  const getStepIndex = (status: string) => {
    return STEPS.findIndex((s) => s.id === status);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          Loading Live Tracking Telemetry...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Clock className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Orders to Track</h3>
        <p className="text-xs text-slate-500">
          When you place a purchase, you can follow its real-time fulfillment progression right here.
        </p>
        <Link href="/client/products">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  const currentStepIdx = activeOrder ? getStepIndex(activeOrder.order_status) : 0;
  const isCancelled = activeOrder?.order_status === 'Cancelled';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Order Tracking Timeline</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time fulfillment milestone timeline directly synchronized from Aiven PostgreSQL.
        </p>
      </div>

      {/* Order Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">Select Order to Track:</span>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {orders.map((o) => (
            <option key={o.customer_order_id} value={o.customer_order_id}>
              {o.customer_order_id} — {formatCurrency(o.total_amount)} ({o.order_status})
            </option>
          ))}
        </select>
      </div>

      {/* Visual Step Tracker Card */}
      {activeOrder && (
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Tracking Order</span>
              <h3 className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {activeOrder.customer_order_id}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Placed on {formatDate(activeOrder.order_date, false)}</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                Total: {formatCurrency(activeOrder.total_amount)}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {isCancelled ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
              <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-base font-bold text-rose-600 dark:text-rose-400">Order Cancelled</h4>
              <p className="text-xs text-rose-500/90 max-w-sm mx-auto">
                This order has been cancelled. Any reserved inventory was automatically restored to warehouse stock.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop Stepper */}
              <div className="hidden md:flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />
                <div
                  className="absolute top-5 left-8 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                  style={{
                    width: `${Math.max(0, (currentStepIdx / (STEPS.length - 1)) * 100)}%`,
                  }}
                />

                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.id} className="flex flex-col items-center relative z-10 space-y-2">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-semibold text-center max-w-[100px] ${
                          isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Vertical Stepper */}
              <div className="md:hidden space-y-6">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx <= currentStepIdx;

                  return (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`text-xs font-bold ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                        {idx === currentStepIdx && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                            Current Stage
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dispatch & Carrier Information */}
          {activeOrder.carrier && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center">
                  <Truck className="w-4 h-4 mr-1.5" /> Dispatched via {activeOrder.carrier}
                </span>
                {activeOrder.dispatched_at && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dispatched on {formatDate(activeOrder.dispatched_at, true)}
                  </span>
                )}
              </div>
              {activeOrder.tracking_number && (
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500">Waybill / Tracking #:</span>
                  <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-emerald-500/20">
                    {activeOrder.tracking_number}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Delivery Destination */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">Delivery Destination:</span>
            <p>{activeOrder.shipping_address}</p>
          </div>
        </div>
      )}
    </div>
  );
}
