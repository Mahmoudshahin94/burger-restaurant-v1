"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalCategories: number;
  activeCategories: number;
  totalProducts: number;
  availableProducts: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  totalCustomers: number;
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [catRes, prodRes, ordersRes, todayOrdersRes, customersRes] = await Promise.all([
        supabase.from("categories").select("id, active"),
        supabase.from("products").select("id, available"),
        supabase.from("orders").select("id, status, total, created_at"),
        supabase.from("orders").select("id, total").gte("created_at", today.toISOString()),
        supabase.from("profiles").select("id").eq("role", "customer"),
      ]);

      const orders = ordersRes.data ?? [];
      const todayOrders = todayOrdersRes.data ?? [];
      const cats = catRes.data ?? [];
      const prods = prodRes.data ?? [];

      setStats({
        totalCategories: cats.length,
        activeCategories: cats.filter((c) => c.active).length,
        totalProducts: prods.length,
        availableProducts: prods.filter((p) => p.available).length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s, o) => s + (o.total ?? 0), 0),
        totalRevenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total ?? 0), 0),
        totalCustomers: (customersRes.data ?? []).length,
      });
      setIsLoading(false);
    }
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Pending Orders", value: stats.pendingOrders, sub: "Need attention", icon: "🕐", colorBg: "bg-amber-50", colorText: "text-amber-600", href: "/admin/dashboard/orders?status=pending" },
      { label: "Today's Orders", value: stats.todayOrders, sub: `${stats.todayRevenue.toFixed(2)} ₪`, icon: "📦", colorBg: "bg-blue-50", colorText: "text-blue-600", href: "/admin/dashboard/orders" },
      { label: "Total Products", value: stats.totalProducts, sub: `${stats.availableProducts} available`, icon: "🍽️", colorBg: "bg-emerald-50", colorText: "text-emerald-600", href: "/admin/dashboard/items" },
      { label: "Customers", value: stats.totalCustomers, sub: "Registered users", icon: "👥", colorBg: "bg-purple-50", colorText: "text-purple-600", href: "/admin/dashboard/customers" },
    ];
  }, [stats]);

  const quickLinks = [
    { href: "/admin/dashboard/orders", label: "Manage Orders", icon: "📦", desc: "View and update order status" },
    { href: "/admin/dashboard/items", label: "Manage Products", icon: "🍽️", desc: "Add, edit, delete products" },
    { href: "/admin/dashboard/categories", label: "Categories", icon: "📂", desc: "Organize product categories" },
    { href: "/admin/dashboard/reports", label: "Reports", icon: "📊", desc: "Sales and order analytics" },
    { href: "/admin/dashboard/customers", label: "Customers", icon: "👥", desc: "View customer profiles" },
    { href: "/admin/dashboard/qrcode", label: "QR Code", icon: "📱", desc: "Download QR for your store" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-4xl space-y-6">

        {/* Welcome hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-espresso via-brand-espresso to-brand-red rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-24 w-32 h-32 rounded-full bg-primary/20 translate-y-1/2 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-white/15 border border-white/25 shadow-lg">
              <Image src="/logo.png" alt="JudyTech" fill className="object-contain p-2" sizes="112px" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold mb-1">Welcome back! 👋</h2>
              <p className="text-white/70 text-sm">Judy Tech Admin — manage your store.</p>
              {stats && (
                <p className="text-white/60 text-sm mt-1">
                  💰 Total revenue: <span className="font-bold text-white">{stats.totalRevenue.toFixed(2)} ₪</span>
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link href="/" target="_blank" className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
                  👁 View Store
                </Link>
                <Link href="/admin/dashboard/orders" className="bg-white text-brand-espresso text-sm px-4 py-2 rounded-xl font-semibold hover:bg-white/90 transition-colors">
                  📦 Manage Orders
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-24 skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 ${card.colorBg} ${card.colorText}`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">{card.label}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-brand-red/20 transition-all group"
              >
                <span className="text-2xl flex-shrink-0">{link.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 group-hover:text-brand-red transition-colors text-sm truncate">{link.label}</p>
                  <p className="text-xs text-gray-400 truncate">{link.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-red flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
