"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/instant/client";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import type { OrderStatus, DeliveryAddress } from "@/types";

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading: loading } = db.useQuery({
    orders: {
      $: { order: { created_at: "desc" } },
      order_items: {},
      profile: {},
    },
  });

  const allOrders = data?.orders ?? [];

  const orders = statusFilter === "all" ? allOrders : allOrders.filter((o) => o.status === statusFilter);

  const filteredOrders = orders.filter((order) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const customerName = order.profile?.full_name?.toLowerCase() ?? "";
    return (
      String(order.order_number).includes(q) ||
      customerName.includes(q) ||
      order.profile?.phone?.includes(q) ||
      order.profile?.email?.toLowerCase().includes(q) ||
      (order.delivery_address as DeliveryAddress | null)?.city?.toLowerCase().includes(q)
    );
  });

  const statusCounts = allOrders.reduce((acc, o) => {
    const s = o.status ?? "pending";
    acc[s as OrderStatus] = (acc[s as OrderStatus] ?? 0) + 1;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return (
    <AdminLayout title="Orders">
      <div className="max-w-5xl space-y-6">

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === "all" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            All ({orders.length})
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === s ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {STATUS_LABELS[s]} {statusCounts[s] ? `(${statusCounts[s]})` : ""}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, email, phone, city..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Orders table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 skeleton" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order) => {
                    const date = new Date(order.created_at!).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    });
                    const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                    const addr = order.delivery_address as DeliveryAddress | null;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 text-sm">#{order.order_number}</p>
                          {addr?.city && <p className="text-xs text-gray-400">{addr.city}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{order.profile?.full_name ?? "Guest"}</p>
                          {order.profile?.email && <p className="text-xs text-gray-400">{order.profile.email}</p>}
                          {order.profile?.phone && <p className="text-xs text-gray-400">{order.profile.phone}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{itemCount} items</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 tabular-nums">{order.total.toFixed(2)} ₪</p>
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={order.status as OrderStatus} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{date}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/dashboard/orders/${order.id}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
