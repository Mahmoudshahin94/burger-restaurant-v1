"use client";

import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<OrderStatus, { label_en: string; label_ar: string; color: string; icon: string }> = {
  pending: { label_en: "Pending", label_ar: "قيد الانتظار", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800", icon: "🕐" },
  confirmed: { label_en: "Confirmed", label_ar: "مؤكد", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800", icon: "✅" },
  out_for_delivery: { label_en: "Out for Delivery", label_ar: "في الطريق إليك", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800", icon: "🛵" },
  delivered: { label_en: "Delivered", label_ar: "تم التوصيل", color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800", icon: "🎉" },
  cancelled: { label_en: "Cancelled", label_ar: "ملغي", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", icon: "❌" },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  lang?: string;
  size?: "sm" | "md";
}

export default function OrderStatusBadge({ status, lang = "en", size = "md" }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const label = lang === "ar" ? config.label_ar : config.label_en;

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${config.color} ${
      size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1"
    }`}>
      <span>{config.icon}</span>
      {label}
    </span>
  );
}

export { STATUS_CONFIG };
