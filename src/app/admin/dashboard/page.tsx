"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import SeedButton from "@/components/admin/SeedButton";

interface StatCard {
  label: string;
  value: number;
  sub: string;
  icon: string;
  colorBg: string;
  colorText: string;
  href: string;
}

export default function DashboardPage() {
  const { data, isLoading } = db.useQuery({ categories: {}, items: {} });

  const stats = useMemo(() => {
    if (!data) return null;
    const items = data.items ?? [];
    const categories = data.categories ?? [];
    return {
      totalCategories: categories.length,
      activeCategories: categories.filter((c: { active: boolean }) => c.active).length,
      totalItems: items.length,
      availableItems: items.filter((i: { available: boolean }) => i.available).length,
      outOfStock: items.filter((i: { available: boolean }) => !i.available).length,
    };
  }, [data]);

  const statCards: StatCard[] = stats
    ? [
        {
          label: "Categories",
          value: stats.totalCategories,
          sub: `${stats.activeCategories} active`,
          icon: "📂",
          colorBg: "bg-blue-50",
          colorText: "text-blue-600",
          href: "/admin/dashboard/categories",
        },
        {
          label: "Total Items",
          value: stats.totalItems,
          sub: `${stats.availableItems} available`,
          icon: "🍽️",
          colorBg: "bg-emerald-50",
          colorText: "text-emerald-600",
          href: "/admin/dashboard/items",
        },
        {
          label: "Available",
          value: stats.availableItems,
          sub: "in stock",
          icon: "✅",
          colorBg: "bg-green-50",
          colorText: "text-green-600",
          href: "/admin/dashboard/items",
        },
        {
          label: "Out of Stock",
          value: stats.outOfStock,
          sub: "items",
          icon: "⚠️",
          colorBg: "bg-red-50",
          colorText: "text-red-600",
          href: "/admin/dashboard/items",
        },
      ]
    : [];

  const quickLinks = [
    { href: "/admin/dashboard/categories", label: "Manage Categories", icon: "📂", desc: "Add, edit, delete categories" },
    { href: "/admin/dashboard/items", label: "Manage Items", icon: "🍽️", desc: "Add, edit, delete menu items" },
    { href: "/admin/dashboard/settings", label: "Settings", icon: "⚙️", desc: "Logo, default language" },
    { href: "/admin/dashboard/qrcode", label: "QR Code", icon: "📱", desc: "Download QR for your menu" },
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
            <p className="text-white/70 text-sm">Judy Tech Admin — manage your digital menu here.</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/"
                target="_blank"
                className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium"
              >
                👁 View Public Menu
              </Link>
              <Link
                href="/admin/dashboard/qrcode"
                className="bg-white text-brand-espresso text-sm px-4 py-2 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                📱 Get QR Code
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-brand-red/20 transition-all group"
              >
                <span className="text-2xl flex-shrink-0">{link.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 group-hover:text-brand-red transition-colors text-sm truncate">
                    {link.label}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{link.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-red flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Seed data prompt */}
        {stats && stats.totalItems === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌱</span>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">Load sample menu data</h3>
                <p className="text-amber-700 text-sm mb-4">
                  Your database is empty. Click below to pre-populate it with starter categories and menu items.
                </p>
                <SeedButton />
              </div>
            </div>
          </div>
        )}


      </div>
    </AdminLayout>
  );
}
