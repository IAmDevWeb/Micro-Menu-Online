"use client";

import { useEffect, useState, useCallback } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
};

const KEY = "mmo_cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) => p.productId === item.productId && (p.note || "") === (item.note || "")
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number, note = "") => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) => p.productId === productId && (p.note || "") === note
      );
      if (idx < 0) return prev;
      const next = [...prev];
      if (qty <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], qty };
      return next;
    });
  }, []);

  const remove = useCallback((productId: string, note = "") => {
    setItems((prev) =>
      prev.filter((p) => !(p.productId === productId && (p.note || "") === note))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, loaded, add, updateQty, remove, clear, total, count };
}
