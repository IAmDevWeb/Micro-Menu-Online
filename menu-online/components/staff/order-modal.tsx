"use client";

import { useEffect, useState } from "react";
import { formatBaht } from "@/lib/format";

type Product = { id: string; name: string; price: number; description: string; imageUrl: string | null };
type Category = { id: string; name: string; products: Product[] };
type Table = { id: string; tableNumber: string };

export default function StaffOrderModal({
  defaultTableId,
  onClose,
}: {
  defaultTableId?: string;
  onClose: () => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableId, setTableId] = useState(defaultTableId || "");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/menu").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
    ])
      .then(([m, t]) => {
        setCats(m.categories || []);
        setTables(t.tables || []);
        if (!defaultTableId && t.tables?.length) {
          setTableId(t.tables[0].id);
        }
      })
      .catch(() => setError("โหลดข้อมูลไม่สำเร็จ"));
  }, [defaultTableId]);

  function add(id: string, delta: number) {
    setCart((c) => {
      const next = { ...c };
      next[id] = Math.max(0, (c[id] || 0) + delta);
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  const allProducts = cats.flatMap((c) => c.products);
  const cartList = allProducts.filter((p) => cart[p.id] && cart[p.id] > 0);
  const total = cartList.reduce((s, p) => s + p.price * cart[p.id], 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tableId || cartList.length === 0) {
      setError("กรุณาเลือกโต๊ะและรายการอาหาร");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        tableId,
        source: "staff",
        customerNote: note,
        items: cartList.map((p) => ({
          productId: p.id,
          qty: cart[p.id],
          note: "",
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "สั่งอาหารไม่สำเร็จ");
        return;
      }
      onClose();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">สั่งอาหารให้ลูกค้า</h2>
          <button onClick={onClose} className="text-neutral-400 text-2xl leading-none">×</button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium">โต๊ะ</label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  โต๊ะ {t.tableNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {cats.map((c) => (
                <div key={c.id}>
                  <div className="font-semibold text-neutral-700 mb-2">{c.name}</div>
                  <div className="space-y-1.5">
                    {c.products.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 pr-2 min-w-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="h-9 w-9 rounded-lg object-cover shrink-0 bg-neutral-100" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">🍽️</div>
                          )}
                          <div className="min-w-0">
                            <div>{p.name}</div>
                            <div className="text-neutral-500 text-xs">{formatBaht(p.price)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button" onClick={() => add(p.id, -1)} className="h-6 w-6 rounded-full border">−</button>
                          <span className="w-5 text-center">{cart[p.id] || 0}</span>
                          <button type="button" onClick={() => add(p.id, 1)} className="h-6 w-6 rounded-full bg-neutral-900 text-white">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-neutral-700">รายการที่สั่ง</div>
              {cartList.length === 0 ? (
                <div className="text-sm text-neutral-400">ยังไม่เลือกรายการ</div>
              ) : (
                <div className="space-y-1.5">
                  {cartList.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2">
                      <span>{cart[p.id]} × {p.name}</span>
                      <span>{formatBaht(p.price * cart[p.id])}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>รวม</span>
                    <span>{formatBaht(total)}</span>
                  </div>
                </div>
              )}
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={submitting || cartList.length === 0}
                className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-semibold disabled:opacity-50"
              >
                {submitting ? "กำลังส่ง..." : "ยืนยันการสั่ง"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
