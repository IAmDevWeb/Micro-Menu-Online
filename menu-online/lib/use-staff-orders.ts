"use client";

import { useEffect, useState, useCallback } from "react";
import { subscribeRoom } from "@/lib/supabase/client";
import { type RealtimeEvent } from "@/lib/realtime";
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

  const applyEvent = useCallback((payload: RealtimeEvent) => {
    if (payload.type === "NEW_ORDER") {
      const order = payload.order as unknown as Order;
      if (!roleFilter(role, order.status)) return;
      setOrders((prev) =>
        prev.some((o) => o.id === order.id) ? prev : [order, ...prev]
      );
      return;
    }
    if (payload.type === "ORDER_STATUS") {
      setOrders((prev) => {
        const next = prev.map((o) =>
          o.id === payload.orderId ? { ...o, status: payload.status } : o
        );
        if (!roleFilter(role, payload.status)) {
          return next.filter((o) => o.id !== payload.orderId);
        }
        return next.filter((o) => roleFilter(role, o.status));
      });
      return;
    }
    if (payload.type === "ORDER_PAID") {
      setOrders((prev) => prev.filter((o) => o.id !== payload.orderId));
      return;
    }
    if (payload.type === "ORDER_CANCELLED") {
      setOrders((prev) => prev.filter((o) => o.id !== payload.orderId));
      return;
    }
  }, [role]);

  const handleEvent = useCallback(
    (payload: RealtimeEvent) => {
      setConnected(true);
      applyEvent(payload);
    },
    [applyEvent]
  );

  useEffect(() => {
    let mounted = true;
    fetch("/api/orders/active")
      .then((r) => r.json())
      .then((data) => {
        if (mounted) {
          const activeOrders = (data.orders || []).filter((order: Order) =>
            roleFilter(role, order.status)
          );
          setOrders(activeOrders);
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    const rooms = role === "admin" ? ["kitchen", "cashier"] : [role];
    const unsubs = rooms.map((room) => subscribeRoom(room, handleEvent));

    return () => {
      mounted = false;
      unsubs.forEach((u) => u());
    };
  }, [role, handleEvent]);

  return { orders, loading, connected };
}
