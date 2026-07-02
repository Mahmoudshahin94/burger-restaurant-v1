"use client";

import { db } from "@/lib/instant/client";
import type { Order } from "@/types";

// Reactive rather than a one-shot fetch: `db.useQuery` keeps this list live
// (e.g. an admin flipping order status shows up here instantly), matching the
// pattern already used by `useUser`. `refetch` is kept as a no-op for API
// compatibility with callers that expect an imperative refresh.
export function useOrders() {
  const { user } = db.useAuth();

  const { data, isLoading, error } = db.useQuery(
    user
      ? {
          orders: {
            $: { where: { "$user.id": user.id }, order: { created_at: "desc" } },
            order_items: {},
          },
        }
      : null
  );

  const orders = (data?.orders as unknown as Order[]) ?? [];

  return {
    orders,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: () => {},
  };
}
