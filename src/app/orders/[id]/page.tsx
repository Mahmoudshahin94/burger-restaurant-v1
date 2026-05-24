"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/hooks/useUser";
import { getOrderById } from "@/app/actions/orders";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import type { Order, OrderStatus, DeliveryAddress } from "@/types";

const STATUS_STEPS: Array<{ key: OrderStatus; label_en: string; label_ar: string; icon: string }> = [
  { key: "pending", label_en: "Order Placed", label_ar: "تم تقديم الطلب", icon: "📋" },
  { key: "confirmed", label_en: "Confirmed", label_ar: "مؤكد", icon: "✅" },
  { key: "out_for_delivery", label_en: "Out for Delivery", label_ar: "في الطريق", icon: "🛵" },
  { key: "delivered", label_en: "Delivered", label_ar: "تم التوصيل", icon: "🎉" },
];

const STATUS_ORDER = ["pending", "confirmed", "out_for_delivery", "delivered"];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { lang, isRTL } = useLanguage();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const result = await getOrderById(params.id);
      if (result.order) setOrder(result.order as Order);
      setLoading(false);
    }
    if (user) load();
  }, [user, params.id]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-ink-2">{lang === "ar" ? "الطلب غير موجود" : "Order not found"}</p>
          <Link href="/orders" className="text-primary font-semibold mt-4 inline-block hover:underline">
            {lang === "ar" ? "عودة للطلبات" : "Back to orders"}
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIdx = STATUS_ORDER.indexOf(order.status ?? "pending");
  const isCancelled = order.status === "cancelled";
  const addr = order.delivery_address as DeliveryAddress | null;

  const date = new Date(order.created_at!).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
      <header className="glass-header sticky top-0 z-50 h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <Link href="/orders" className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors">
            <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-ink flex-1 text-center pe-8">
            {lang === "ar" ? "طلب" : "Order"} #{order.order_number}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-20">
        {/* Success banner for new orders */}
        {isNew && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-5 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-green-700 dark:text-green-400">
              {lang === "ar" ? "تم تقديم طلبك بنجاح!" : "Order placed successfully!"}
            </p>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              {lang === "ar" ? "سنتواصل معك قريباً لتأكيد الطلب" : "We'll contact you soon to confirm your order"}
            </p>
          </motion.div>
        )}

        {/* Status & Basic info */}
        <div className="bg-surface rounded-3xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-ink">{lang === "ar" ? "طلب" : "Order"} #{order.order_number}</p>
              <p className="text-xs text-ink-3 mt-0.5">{date}</p>
            </div>
            <OrderStatusBadge status={order.status as OrderStatus} lang={lang} />
          </div>

          {/* Status timeline */}
          {!isCancelled && (
            <div className="flex items-start gap-1 mt-4">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      isCompleted ? "bg-primary text-white shadow-sm" : "bg-surface-2 text-ink-3 border border-border"
                    } ${isCurrent ? "ring-2 ring-primary/20 ring-offset-1" : ""}`}>
                      {isCompleted ? step.icon : <span className="w-2 h-2 rounded-full bg-border" />}
                    </div>
                    <p className={`text-[10px] font-medium text-center leading-tight ${isCompleted ? "text-primary" : "text-ink-3"}`}>
                      {lang === "ar" ? step.label_ar : step.label_en}
                    </p>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`absolute h-0.5 w-full top-4 ${isCompleted ? "bg-primary" : "bg-border"}`} style={{ transform: "translateX(50%)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isCancelled && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">
              {lang === "ar" ? "تم إلغاء هذا الطلب" : "This order has been cancelled"}
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="bg-surface rounded-3xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-ink text-sm">{lang === "ar" ? "المنتجات" : "Items"}</h2>
          <div className="space-y-2.5">
            {order.order_items?.map((item) => {
              const name = lang === "ar" ? item.product_name_ar : item.product_name_en;
              const sizeLabel = item.size === "small" ? (lang === "ar" ? "صغير" : "Small") : item.size === "large" ? (lang === "ar" ? "كبير" : "Large") : null;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{name}</p>
                    <p className="text-xs text-ink-3">{sizeLabel && `${sizeLabel} · `}{lang === "ar" ? "الكمية" : "Qty"}: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-ink tabular-nums text-sm flex-shrink-0">
                    {item.total_price.toFixed(2)} ₪
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-2">
              <span>{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
              <span className="font-semibold">{order.subtotal.toFixed(2)} ₪</span>
            </div>
            <div className="flex justify-between text-sm text-ink-2">
              <span>{lang === "ar" ? "التوصيل" : "Delivery"}</span>
              <span className="text-green-600 font-semibold">{lang === "ar" ? "مجاني" : "Free"}</span>
            </div>
            <div className="flex justify-between font-bold text-ink border-t border-border pt-1.5">
              <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-primary text-lg">{order.total.toFixed(2)} ₪</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        {addr && (
          <div className="bg-surface rounded-3xl border border-border p-5 space-y-2">
            <h2 className="font-bold text-ink text-sm">{lang === "ar" ? "عنوان التوصيل" : "Delivery Address"}</h2>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📍</span>
              <div>
                <p className="text-sm text-ink font-medium">{addr.street}, {addr.city}</p>
                {addr.area && <p className="text-xs text-ink-2">{addr.area}</p>}
                {(addr.building || addr.floor) && (
                  <p className="text-xs text-ink-2">
                    {addr.building && `${lang === "ar" ? "مبنى" : "Building"} ${addr.building}`}
                    {addr.floor && ` · ${lang === "ar" ? "طابق" : "Floor"} ${addr.floor}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment */}
        <div className="bg-surface rounded-3xl border border-border p-5">
          <h2 className="font-bold text-ink text-sm mb-3">{lang === "ar" ? "الدفع" : "Payment"}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xl">💵</span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {order.payment_method === "cod" ? (lang === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery") : order.payment_method}
              </p>
              <p className="text-xs text-ink-3">
                {order.payment_status === "pending" ? (lang === "ar" ? "في انتظار الدفع" : "Pending payment") : order.payment_status}
              </p>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-surface rounded-3xl border border-border p-5">
            <h2 className="font-bold text-ink text-sm mb-2">{lang === "ar" ? "ملاحظات" : "Notes"}</h2>
            <p className="text-sm text-ink-2">{order.notes}</p>
          </div>
        )}

        <Link href="/" className="block text-center py-3 rounded-2xl border border-border text-ink-2 text-sm font-medium hover:border-primary hover:text-primary transition-all">
          {lang === "ar" ? "متابعة التسوق" : "Continue Shopping"}
        </Link>
      </main>
    </div>
  );
}
