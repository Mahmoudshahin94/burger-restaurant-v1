"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/hooks/useUser";
import { getOrders } from "@/app/actions/orders";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import type { Order, OrderStatus } from "@/types";

export default function OrdersPage() {
  const { lang, isRTL } = useLanguage();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login?next=/orders");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const result = await getOrders();
      if (result.orders) setOrders(result.orders as Order[]);
      setLoading(false);
    }
    if (user) load();
  }, [user]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
      <header className="glass-header sticky top-0 z-50 h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors">
            <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-ink flex-1 text-center pe-8">
            {lang === "ar" ? "طلباتي" : "My Orders"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <div className="text-7xl mb-4 opacity-30">📦</div>
            <p className="text-ink-2 font-semibold text-lg">{lang === "ar" ? "لا يوجد طلبات بعد" : "No orders yet"}</p>
            <p className="text-ink-3 text-sm mt-1">{lang === "ar" ? "ابدأ التسوق الآن!" : "Start shopping now!"}</p>
            <Link href="/" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all">
              {lang === "ar" ? "تصفح المنتجات" : "Browse Products"}
            </Link>
          </motion.div>
        ) : (
          orders.map((order, i) => {
            const date = new Date(order.created_at!).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
              year: "numeric", month: "short", day: "numeric",
            });
            const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/orders/${order.id}`}>
                  <div className="bg-surface rounded-3xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-ink text-sm">
                          {lang === "ar" ? "طلب" : "Order"} #{order.order_number}
                        </p>
                        <p className="text-xs text-ink-3 mt-0.5">{date}</p>
                      </div>
                      <OrderStatusBadge status={order.status as OrderStatus} lang={lang} size="sm" />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-ink-2">
                        {itemCount} {lang === "ar" ? "منتج" : "items"}
                        {order.delivery_address && (
                          <span className="text-ink-3"> · {(order.delivery_address as { city?: string }).city}</span>
                        )}
                      </p>
                      <p className="font-bold text-primary tabular-nums text-sm">
                        {order.total.toFixed(2)} ₪
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}
