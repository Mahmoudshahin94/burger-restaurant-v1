"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/instant/client";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import type { OrderStatus, DeliveryAddress } from "@/types";

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const { data, isLoading: loading } = db.useQuery({
    orders: {
      $: { where: { id: params.id } },
      order_items: {},
      profile: {},
    },
  });

  const order = data?.orders?.[0] ?? null;

  useEffect(() => {
    if (order) setAdminNotes(order.notes ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  async function updateStatus(newStatus: OrderStatus) {
    if (!order) return;
    setUpdating(true);

    const now = new Date().toISOString();
    if (newStatus === "confirmed") {
      await db.transact(db.tx.orders[order.id].update({ status: newStatus, confirmed_at: now }));
    } else if (newStatus === "out_for_delivery") {
      await db.transact(db.tx.orders[order.id].update({ status: newStatus, out_for_delivery_at: now }));
    } else if (newStatus === "delivered") {
      await db.transact(db.tx.orders[order.id].update({ status: newStatus, delivered_at: now }));
    } else if (newStatus === "cancelled") {
      await db.transact(db.tx.orders[order.id].update({ status: newStatus, cancelled_at: now }));
    } else {
      await db.transact(db.tx.orders[order.id].update({ status: newStatus }));
    }

    setUpdating(false);
  }

  async function saveNotes() {
    if (!order) return;
    await db.transact(db.tx.orders[order.id].update({ notes: adminNotes }));
  }

  if (loading) {
    return (
      <AdminLayout title="Order Detail">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Order Not Found">
        <div className="text-center py-16">
          <p className="text-gray-500">Order not found</p>
          <button onClick={() => router.back()} className="text-primary font-semibold mt-4 hover:underline">
            Go back
          </button>
        </div>
      </AdminLayout>
    );
  }

  const currentStatus = order.status as OrderStatus;
  const nextStatuses = STATUS_TRANSITIONS[currentStatus];
  const addr = order.delivery_address as DeliveryAddress | null;

  const date = new Date(order.created_at!).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const STATUS_STEPS: Array<{ key: OrderStatus; label: string; icon: string; ts: string | number | null | undefined }> = [
    { key: "pending", label: "Order Placed", icon: "📋", ts: order.created_at },
    { key: "confirmed", label: "Confirmed", icon: "✅", ts: order.confirmed_at },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵", ts: order.out_for_delivery_at },
    { key: "delivered", label: "Delivered", icon: "🎉", ts: order.delivered_at },
  ];

  const statusIdx = ["pending", "confirmed", "out_for_delivery", "delivered"].indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <AdminLayout title={`Order #${order.order_number}`}>
      <div className="max-w-4xl space-y-6">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{date}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <OrderStatusBadge status={currentStatus} />
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                  s === "cancelled"
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {updating ? "..." : `→ ${STATUS_LABELS[s]}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Order info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Status timeline */}
            {!isCancelled && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Status Timeline</h3>
                <div className="space-y-3">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= statusIdx;
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                          isCompleted ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                        }`}>
                          {isCompleted ? step.icon : <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                            {step.label}
                          </p>
                          {step.ts && isCompleted && (
                            <p className="text-xs text-gray-400">
                              {new Date(step.ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        {isCompleted && idx === statusIdx && (
                          <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
                ❌ This order was cancelled
                {order.cancelled_at && (
                  <span className="text-red-500 font-normal"> · {new Date(order.cancelled_at).toLocaleDateString()}</span>
                )}
              </div>
            )}

            {/* Order items */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.product_name_en}</p>
                      <p className="text-xs text-gray-500">
                        {item.size && `${item.size} · `}Qty: {item.quantity} × {item.unit_price.toFixed(2)} ₪
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 tabular-nums">{item.total_price.toFixed(2)} ₪</p>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{order.subtotal.toFixed(2)} ₪</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1">
                    <span>Total</span>
                    <span className="text-primary text-lg">{order.total.toFixed(2)} ₪</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Order Notes</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                onBlur={saveNotes}
                rows={2}
                placeholder="Add notes..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Right: Customer info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Customer</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(order.profile?.full_name ?? "G")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{order.profile?.full_name ?? "Guest"}</p>
                    {order.profile?.email && <p className="text-xs text-gray-500">{order.profile.email}</p>}
                    {order.profile?.phone && <p className="text-xs text-gray-500">{order.profile.phone}</p>}
                  </div>
                </div>
                {order.profile?.id && (
                  <a
                    href={`/admin/dashboard/customers/${order.profile.id}`}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    View customer →
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Delivery Address</h3>
              {addr ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">{addr.street}</p>
                  <p>{addr.city}{addr.area && `, ${addr.area}`}</p>
                  {addr.building && <p>Building {addr.building}{addr.floor && `, Floor ${addr.floor}`}</p>}
                  {addr.notes && <p className="text-gray-400 text-xs">{addr.notes}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No address</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Payment</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium">{order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium capitalize ${order.payment_status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
