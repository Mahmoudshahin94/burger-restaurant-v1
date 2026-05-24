"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types";

export function useOrders() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setOrders((data as Order[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
