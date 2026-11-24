'use client';

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Package,
  IndianRupee,
  MapPin,
  Phone,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function ClientCheckoutPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [user, setUser] = React.useState<any>(null);
  const [cartItems, setCartItems] = React.useState<any[]>([]);
  const [subtotal, setSubtotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Form
  const [shippingAddress, setShippingAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [orderComplete, setOrderComplete] = React.useState<any>(null);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/client/cart').then((r) => r.json()),
    ])
      .then(([userData, cartData]) => {
        if (userData.user) {
          setUser(userData.user);
          if (userData.user.phone) setPhone(userData.user.phone);
        }
        if (cartData.success && cartData.data) {
          setCartItems(cartData.data.items || []);
          setSubtotal(cartData.data.subtotal || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      error("Please enter your complete shipping delivery address");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/client/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress,
          phone,
          paymentMethod: 'Cash on Delivery (COD)',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to place order');
      }

      success("Order placed successfully! Inventory allocated atomically.");
      setOrderComplete(json.data);
    } catch (err: any) {
      error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          Preparing Checkout Session...
        </p>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Order Confirmed!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Order Reference ID: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{orderComplete.orderId}</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Charged:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(orderComplete.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Option:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Cash on Delivery (COD)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Delivery Address:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{shippingAddress}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Stock quantities allocated &amp; deducted from warehouse inventory.
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Link href="/client/orders">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
              View My Orders
            </Button>
          </Link>
          <Link href="/client/tracking">
            <Button variant="outline" className="text-xs">
              Track Fulfillment →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    router.push('/client/cart');
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Checkout &amp; Place Order</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Confirm shipping delivery details and dispatch your order.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Delivery Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handlePlaceOrder} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Customer &amp; Shipping Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || ''}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <Input
              label="Contact Phone Number *"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Complete Shipping Address *
              </label>
              <textarea
                required
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Building No., Street, Industrial Area, City, State, PIN Code"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Option
              </label>
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs flex items-center justify-between">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Cash on Delivery (COD)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">Standard</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                isLoading={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-sm shadow-md shadow-emerald-500/20"
              >
                Place Order Now ({formatCurrency(subtotal)})
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        </div>

        {/* Order Items Preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Items in Order ({cartItems.length})
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="py-2.5 flex justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                    <span className="text-slate-500">{item.quantity} × {formatCurrency(item.price)}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.line_total)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500">Total Due:</span>
              <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
