'use client';

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ClientCartPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [cartItems, setCartItems] = React.useState<any[]>([]);
  const [subtotal, setSubtotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const fetchCart = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/cart');
      const json = await res.json();
      if (json.success && json.data) {
        setCartItems(json.data.items || []);
        setSubtotal(json.data.subtotal || 0);
      }
    } catch {
      error("Failed to load shopping cart");
    } finally {
      setLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (cartItemId: string, newQty: number) => {
    try {
      const res = await fetch('/api/client/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity: newQty }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update quantity');
      fetchCart();
    } catch (err: any) {
      error(err.message);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/client/cart?cartItemId=${cartItemId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove item');
      success("Item removed from cart");
      fetchCart();
    } catch (err: any) {
      error(err.message);
    }
  };

  const clearCart = async () => {
    if (!confirm("Are you sure you want to empty your shopping cart?")) return;
    try {
      const res = await fetch('/api/client/cart', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to clear cart');
      success("Shopping cart cleared");
      fetchCart();
    } catch (err: any) {
      error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          Retrieving PostgreSQL Persistent Cart...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Shopping Cart</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your cart is persisted in PostgreSQL across devices and sessions.
          </p>
        </div>
        {cartItems.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-rose-500 hover:text-rose-600 text-xs">
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear Cart
          </Button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your shopping cart is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore our product catalog to add inventory supplies and place your B2B order.
          </p>
          <Link href="/client/products">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              Browse Product Catalog
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cartItems.map((item) => (
                  <div key={item.cart_item_id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">{item.product_id}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h4>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                          {formatCurrency(item.price)} each
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          disabled={item.quantity >= item.available_stock}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white w-24 text-right">
                        {formatCurrency(item.line_total)}
                      </span>

                      <button
                        onClick={() => removeItem(item.cart_item_id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/client/products" className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-500">
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary & Checkout Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Cart Subtotal</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Standard Shipping</span>
                  <span className="font-mono font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Cash on Delivery (COD)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Estimated Total:</span>
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <Link href="/client/checkout" className="block pt-2">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-sm shadow-md shadow-emerald-500/20">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero-Overselling Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Stock is locked and deducted atomically from regional warehouses upon checkout.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
