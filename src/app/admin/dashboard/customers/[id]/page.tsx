"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { createClient } from "@/lib/supabase/client";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import type { Order, OrderStatus } from "@/types";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; phone: string | null; created_at: string | null; role: string | null } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [profileRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", params.id).single(),
        supabase.from("orders").select("*, order_items(*)").eq("user_id", params.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      setLoading(false);
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <AdminLayout title="Customer">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout title="Customer Not Found">
        <div className="text-center py-16">
          <p className="text-gray-500">Customer not found</p>
          <button onClick={() => router.back()} className="text-primary font-semibold mt-4 hover:underline">Go back</button>
        </div>
      </AdminLayout>
    );
  }

  const totalSpent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const initials = profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <AdminLayout title="Customer Detail">
      <div className="max-w-4xl space-y-6">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary text-xl font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name ?? "Unknown"}</h2>
              {profile.phone && <p className="text-gray-500 text-sm">{profile.phone}</p>}
              <p className="text-xs text-gray-400 mt-0.5">
                Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unknown"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
            <div className="text-center bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{orders.filter((o) => o.status === "delivered").length}</p>
              <p className="text-xs text-gray-500">Delivered</p>
            </div>
            <div className="text-center bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-primary">{totalSpent.toFixed(2)}</p>
              <p className="text-xs text-gray-500">₪ Spent</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Order History</h3>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map((order) => {
                const date = new Date(order.created_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                return (
                  <div key={order.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">#{order.order_number}</p>
                      <p className="text-xs text-gray-500">{date} · {itemCount} items</p>
                    </div>
                    <OrderStatusBadge status={order.status as OrderStatus} size="sm" />
                    <p className="font-bold text-gray-900 tabular-nums text-sm">{order.total.toFixed(2)} ₪</p>
                    <Link href={`/admin/dashboard/orders/${order.id}`} className="text-xs text-primary font-semibold hover:underline">
                      View →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
