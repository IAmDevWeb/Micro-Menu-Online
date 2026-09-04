"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order } from "@/lib/types";

const ACTIVE_STATUSES: Record<string, string[]> = {
  kitchen: ["pending", "preparing"],
  cashier: ["pending", "preparing", "served"],
  admin: ["pending", "preparing", "served"],
};

function roleFilter(role: string, status: string) {
  return ACTIVE_STATUSES[role]?.includes(status) ?? false;
}

export function useStaffOrders(role: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch("/api/orders/active");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const activeOrders = (data.orders || []).filter((order: Order) =>
          roleFilter(role, order.status)
        );
        setOrders(activeOrders);
        setConnected(true);
      } catch {
        if (mounted) setConnected(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    poll();
    timer = setInterval(poll, 5000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [role]);

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    if (!roleFilter(role, status)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }, [role]);

  return { orders, loading, connected, updateOrderStatus };
}
