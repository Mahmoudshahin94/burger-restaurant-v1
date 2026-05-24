"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { createClient } from "@/lib/supabase/client";

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  order_count: number;
  total_spent: number;
}

export default function CustomersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (!profiles) {
        setLoading(false);
        return;
      }

      const ids = profiles.map((p) => p.id);
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total")
        .in("user_id", ids)
        .neq("status", "cancelled");

      const statsMap = new Map<string, { count: number; total: number }>();
      (orders ?? []).forEach((o) => {
        const uid = o.user_id!;
        const existing = statsMap.get(uid) ?? { count: 0, total: 0 };
        statsMap.set(uid, { count: existing.count + 1, total: existing.total + o.total });
      });

      setCustomers(
        profiles.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          created_at: p.created_at,
          order_count: statsMap.get(p.id)?.count ?? 0,
          total_spent: statsMap.get(p.id)?.total ?? 0,
        }))
      );
      setLoading(false);
    }
    fetchCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <AdminLayout title="Customers">
      <div className="max-w-4xl space-y-5">

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-16 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-gray-500 font-medium">No customers yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((customer) => {
                    const joined = customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—";
                    const initials = customer.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{customer.full_name ?? "Unknown"}</p>
                              {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{customer.order_count}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{customer.total_spent.toFixed(2)} ₪</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{joined}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/dashboard/customers/${customer.id}`} className="text-xs font-semibold text-primary hover:underline">
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
