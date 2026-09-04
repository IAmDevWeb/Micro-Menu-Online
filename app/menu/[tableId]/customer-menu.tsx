"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatBaht } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  price: number;
  qty: number;
  note: string | null;
  status: string;
};

type Order = {
  id: string;
  tableId: string;
  tableNumber?: string;
  status: string;
  source: string;
  customerNote: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  items: OrderItem[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอรับคำสั่ง",
  preparing: "กำลังปรุง",
  served: "เสิร์ฟแล้ว",
  paid: "ชำระเงินแล้ว",
  cancelled: "ยกเลิก",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-800",
  served: "bg-green-100 text-green-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function CustomerMenu({
  table,
}: {
  table: { id: string; tableNumber: string };
}) {
  const router = useRouter();
  const cart = useCart();
  const [menu, setMenu] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"menu" | "cart" | "status">("menu");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === activeOrderId) || null,
    [orders, activeOrderId]
  );

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [menuRes, orderRes] = await Promise.all([
          fetch("/api/menu").then((r) => r.json()),
          fetch(`/api/orders?tableId=${table.id}`).then((r) => r.json()),
        ]);
        if (!mounted) return;
        setMenu(menuRes.categories || []);
        setOrders(orderRes.orders || []);
      } catch {
        if (mounted) setErr("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [table.id]);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function pollStatus() {
      try {
        const res = await fetch(`/api/orders?tableId=${table.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const latest: Order[] = data.orders || [];
        setOrders((prev) => {
          const map = new Map(prev.map((o) => [o.id, o]));
          for (const o of latest) map.set(o.id, o);
          return Array.from(map.values());
        });
      } catch {
        // ignore transient errors
      }
    }

    pollStatus();
    timer = setInterval(pollStatus, 5000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [table.id]);

  const placeOrder = useCallback(
    async (source: "self") => {
      setErr(null);
      if (cart.items.length === 0) return;
      setSubmitting(true);
      try {
        const payload = {
          tableId: table.id,
          source,
          customerNote: note.trim(),
          items: cart.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            note: i.note || "",
          })),
        };
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setErr(data.error || "สั่งอาหารไม่สำเร็จ");
          return;
        }
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === data.order.id);
          return exists ? prev : [data.order, ...prev];
        });
        setActiveOrderId(data.order.id);
        cart.clear();
        setNote("");
        setView("status");
      } catch {
        setErr("เกิดข้อผิดพลาด กรุณาลองใหม่");
      } finally {
        setSubmitting(false);
      }
    },
    [cart, note, table.id]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-neutral-500">กำลังโหลดเมนู...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-32 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">เมนูอาหาร</h1>
          <p className="text-sm text-neutral-500">
            โต๊ะ <span className="font-semibold text-neutral-800">{table.tableNumber}</span>
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-neutral-500 underline"
        >
          เปลี่ยนโต๊ะ
        </button>
      </header>

      {err && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
          {err}
        </div>
      )}

      {view === "menu" && (
        <MenuView menu={menu} cart={cart} />
      )}

      {view === "cart" && (
        <CartView
          cart={cart}
          note={note}
          setNote={setNote}
          submitting={submitting}
          onBack={() => setView("menu")}
          onPlace={(s) => placeOrder(s)}
        />
      )}

      {view === "status" && <StatusView order={activeOrder} onBackToList={() => setView("menu")} />}

      {view === "menu" && cart.items.length > 0 && (
        <button
          onClick={() => setView("cart")}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-emerald-600 text-white px-6 py-3 shadow-lg font-semibold"
        >
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-sm">
            {cart.count}
          </span>
          <span>ดูตะกร้า</span>
          <span>{formatBaht(cart.total)}</span>
        </button>
      )}
    </div>
  );
}

function MenuView({
  menu,
  cart,
}: {
  menu: Category[];
  cart: ReturnType<typeof useCart>;
}) {
  return (
    <div className="space-y-6">
      {menu.length === 0 && (
        <p className="text-neutral-500 text-center py-10">ยังไม่มีเมนู</p>
      )}
      {menu.map((cat) => (
        <section key={cat.id}>
          <h2 className="font-semibold border-b pb-2 mb-3 text-neutral-700">
            {cat.name}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {cat.products.map((p) => {
              const qtyInCart = cart.items
                .filter((i) => i.productId === p.id)
                .reduce((s, i) => s + i.qty, 0);
              return (
                <div
                  key={p.id}
                  className="rounded-xl bg-white border p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3 pr-3 min-w-0">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-16 w-16 rounded-xl object-cover shrink-0 bg-neutral-100"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl shrink-0">
                        🍽️
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium">{p.name}</div>
                      {p.description && (
                        <div className="text-sm text-neutral-500">{p.description}</div>
                      )}
                      <div className="text-emerald-700 font-semibold mt-1">
                        {formatBaht(p.price)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {qtyInCart > 0 && (
                      <>
                        <button
                          onClick={() => cart.updateQty(p.id, qtyInCart - 1)}
                          className="h-8 w-8 rounded-full border text-lg"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-semibold">{qtyInCart}</span>
                      </>
                    )}
                    <button
                      onClick={() => cart.add({ productId: p.id, name: p.name, price: p.price, qty: 1 })}
                      className="h-8 w-8 rounded-full bg-emerald-600 text-white text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function CartView({
  cart,
  note,
  setNote,
  submitting,
  onBack,
  onPlace,
}: {
  cart: ReturnType<typeof useCart>;
  note: string;
  setNote: (n: string) => void;
  submitting: boolean;
  onBack: () => void;
  onPlace: (source: "self") => void;
}) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-neutral-500 underline">
        ← กลับไปเมนู
      </button>
      <h2 className="text-lg font-bold">ตะกร้าของฉัน</h2>
      {cart.items.length === 0 && <p className="text-neutral-500">ตะกร้าว่างเปล่า</p>}
      <div className="space-y-3">
        {cart.items.map((i, idx) => (
          <div key={`${i.productId}-${i.note}-${idx}`} className="flex items-center justify-between bg-white border rounded-xl p-3">
            <div>
              <div className="font-medium">{i.name}</div>
              <div className="text-sm text-neutral-500">
                {formatBaht(i.price)} × {i.qty}
              </div>
              <input
                value={i.note || ""}
                onChange={(e) => cart.updateQty(i.productId, i.qty, e.target.value)}
                placeholder="หมายเหตุ (เช่น ไม่เผ็ด)"
                className="mt-1 w-48 text-sm border rounded px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cart.updateQty(i.productId, i.qty - 1, i.note || "")}
                className="h-7 w-7 rounded-full border"
              >
                −
              </button>
              <span className="w-5 text-center">{i.qty}</span>
              <button
                onClick={() => cart.updateQty(i.productId, i.qty + 1, i.note || "")}
                className="h-7 w-7 rounded-full bg-emerald-600 text-white"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl p-3">
        <label className="text-sm text-neutral-600">หมายเหตุทั้งออเดอร์</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น ส่งที่โต๊ะ A1"
          className="mt-1 w-full text-sm border rounded px-2 py-2"
        />
      </div>
      <div className="flex items-center justify-between font-semibold">
        <span>รวมทั้งหมด</span>
        <span className="text-emerald-700">{formatBaht(cart.total)}</span>
      </div>
      <button
        disabled={cart.items.length === 0 || submitting}
        onClick={() => onPlace("self")}
        className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold disabled:opacity-50"
      >
        {submitting ? "กำลังส่งคำสั่ง..." : "สั่งอาหาร"}
      </button>
    </div>
  );
}

function StatusView({
  order,
  onBackToList,
}: {
  order: Order | null;
  onBackToList: () => void;
}) {
  if (!order) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-500">ยังไม่มีคำสั่งซื้อ</p>
        <button onClick={onBackToList} className="mt-4 text-emerald-700 underline">
          ไปเลือกรายการอาหาร
        </button>
      </div>
    );
  }

  const done = order.status === "paid" || order.status === "cancelled";

  return (
    <div className="space-y-4 animate-pop-in">
      <div className="text-center py-4">
        <h2 className="text-lg font-bold">💬 สถานะคำสั่งซื้อ</h2>
        <span
          className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
            STATUS_COLOR[order.status] || "bg-neutral-100"
          }`}
        >
          {STATUS_LABEL[order.status] || order.status}
        </span>
        {order.status === "paid" && (
          <p className="mt-2 text-emerald-700 font-medium">ขอบคุณค่ะ 🙏</p>
        )}
        {order.status === "cancelled" && (
          <p className="mt-2 text-red-600">คำสั่งซื้อนี้ถูกยกเลิก</p>
        )}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="bg-neutral-100 px-4 py-2 text-sm font-medium">
          รายการที่สั่ง (โต๊ะ {order.tableNumber})
        </div>
        <div className="divide-y">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between px-4 py-2 text-sm">
              <div>
                <div>{it.productName}</div>
                {it.note && <div className="text-neutral-500">• {it.note}</div>}
              </div>
              <div className="text-right">
                <div>
                  {it.qty} × {formatBaht(it.price)}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between px-4 py-2 font-semibold">
            <span>รวม</span>
            <span>{formatBaht(order.total)}</span>
          </div>
        </div>
      </div>

      {!done && (
        <p className="text-sm text-neutral-500 text-center">
          ระบบจะอัปเดตสถานะให้อัตโนมัติแบบเรียลไทม์ ครัวกำลังจัดเตรียมอาหารค่ะ
        </p>
      )}

      <button
        onClick={onBackToList}
        className="w-full rounded-xl bg-neutral-800 text-white py-3 font-semibold"
      >
        {done ? "สั่งเพิ่ม" : "สั่งรายการเพิ่ม"}
      </button>
    </div>
  );
}
