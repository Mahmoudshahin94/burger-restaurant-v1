"use client";

import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/instant/client";

type Period = "today" | "week" | "month" | "all";

interface ReportData {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  dailyRevenue: Array<{ date: string; revenue: number; count: number }>;
  cancelRate: number;
}

function getPeriodRange(period: Period): { from: Date | null; label: string } {
  const now = new Date();
  if (period === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, label: "Today" };
  }
  if (period === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { from, label: "Last 7 days" };
  }
  if (period === "month") {
    const from = new Date(now);
    from.setMonth(now.getMonth() - 1);
    return { from, label: "Last 30 days" };
  }
  return { from: null, label: "All time" };
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");

  const { data: queryData, isLoading: loading } = db.useQuery({
    orders: { order_items: {} },
  });

  const data = useMemo<ReportData | null>(() => {
    if (!queryData) return null;

    const { from } = getPeriodRange(period);
    const fromTime = from ? from.getTime() : null;

    const allOrders = queryData.orders ?? [];
    const orders = fromTime
      ? allOrders.filter((o) => new Date(o.created_at).getTime() >= fromTime)
      : allOrders;

    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

    const totalRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
    const orderCount = activeOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const cancelRate = orders.length > 0 ? (cancelledCount / orders.length) * 100 : 0;

    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o) => {
      const s = o.status ?? "pending";
      ordersByStatus[s] = (ordersByStatus[s] ?? 0) + 1;
    });

    // Top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    activeOrders.forEach((order) => {
      order.order_items?.forEach((item) => {
        const key = item.product_name_en;
        const existing = productMap.get(key) ?? { name: key, quantity: 0, revenue: 0 };
        productMap.set(key, {
          name: key,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total_price,
        });
      });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Daily revenue (last 7 days for chart)
    const dailyMap = new Map<string, { revenue: number; count: number }>();
    const daysToShow = period === "today" ? 1 : period === "week" ? 7 : 30;
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { revenue: 0, count: 0 });
    }
    activeOrders.forEach((order) => {
      const key = new Date(order.created_at).toISOString().split("T")[0];
      const existing = dailyMap.get(key);
      if (existing) {
        dailyMap.set(key, { revenue: existing.revenue + order.total, count: existing.count + 1 });
      }
    });
    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d }));

    return { totalRevenue, orderCount, avgOrderValue, ordersByStatus, topProducts, dailyRevenue, cancelRate };
  }, [queryData, period]);

  const periods: Array<{ key: Period; label: string }> = [
    { key: "today", label: "Today" },
    { key: "week", label: "7 Days" },
    { key: "month", label: "30 Days" },
    { key: "all", label: "All Time" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-400",
    confirmed: "bg-blue-400",
    out_for_delivery: "bg-purple-400",
    delivered: "bg-green-500",
    cancelled: "bg-red-400",
  };
  const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const maxRevenue = data ? Math.max(...data.dailyRevenue.map((d) => d.revenue), 1) : 1;

  return (
    <AdminLayout title="Reports">
      <div className="max-w-5xl space-y-6">

        {/* Period selector */}
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === p.key ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 h-24 skeleton" />)}
          </div>
        ) : data ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: `${data.totalRevenue.toFixed(2)} ₪`, icon: "💰", color: "text-green-600" },
                { label: "Orders", value: data.orderCount, icon: "📦", color: "text-blue-600" },
                { label: "Avg Order", value: `${data.avgOrderValue.toFixed(2)} ₪`, icon: "📊", color: "text-purple-600" },
                { label: "Cancel Rate", value: `${data.cancelRate.toFixed(1)}%`, icon: "❌", color: "text-red-500" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{kpi.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            {data.dailyRevenue.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
                <div className="flex items-end gap-1 h-32">
                  {data.dailyRevenue.map((d) => {
                    const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                    const dateLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-primary/20 rounded-t group-hover:bg-primary/40 transition-colors cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${dateLabel}: ${d.revenue.toFixed(2)} ₪`}
                        />
                        {data.dailyRevenue.length <= 10 && (
                          <p className="text-[9px] text-gray-400 text-center truncate w-full">{dateLabel}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Order status breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
                <div className="space-y-3">
                  {Object.entries(data.ordersByStatus).map(([status, count]) => {
                    const total = Object.values(data.ordersByStatus).reduce((s, c) => s + c, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 capitalize">{STATUS_LABELS[status] ?? status}</span>
                          <span className="font-bold text-gray-900">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${STATUS_COLORS[status] ?? "bg-gray-400"} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top products */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
                {data.topProducts.length === 0 ? (
                  <p className="text-gray-400 text-sm">No data</p>
                ) : (
                  <div className="space-y-3">
                    {data.topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.quantity} sold</p>
                        </div>
                        <p className="font-bold text-gray-900 tabular-nums text-sm flex-shrink-0">{p.revenue.toFixed(2)} ₪</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
