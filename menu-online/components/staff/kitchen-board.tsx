"use client";

import { useMemo, useState } from "react";
import { useStaffOrders } from "@/lib/use-staff-orders";
import { formatTime } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function KitchenBoard({ role }: { role: string }) {
  const { orders, loading, connected } = useStaffOrders(role);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const rank: Record<string, number> = { pending: 0, preparing: 1, served: 2 };
    return [...orders]
      .filter((order) => order.status !== "served")
      .sort((a, b) => {
        const ra = rank[a.status] ?? 9;
        const rb = rank[b.status] ?? 9;
        if (ra !== rb) return ra - rb;
        return a.createdAt.localeCompare(b.createdAt);
      });
  }, [orders]);

  async function setStatus(id: string, status: string) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "อัปเดตไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Header connected={connected} loading={loading} />

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="text-center py-16 text-neutral-500">
          ยังไม่มีคำสั่งอาหาร
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((o) => (
          <KitchenCard
            key={o.id}
            order={o}
            updating={updatingId === o.id}
            onStart={() => setStatus(o.id, "preparing")}
            onDone={() => setStatus(o.id, "served")}
          />
        ))}
      </div>
    </div>
  );
}

function Header({
  connected,
  loading,
}: {
  connected: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">ครัว — คำสั่งอาหาร</h1>
        <p className="text-sm text-neutral-500">
          รับคำสั่งใหม่จากลูกค้าแบบเรียลไทม์
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            connected ? "bg-emerald-500" : "bg-red-400"
          }`}
        />
        <span className="text-neutral-500">
          {connected ? "เชื่อมต่อสด" : loading ? "กำลังโหลด..." : "ขาดการเชื่อมต่อ"}
        </span>
      </div>
    </div>
  );
}

function KitchenCard({
  order,
  updating,
  onStart,
  onDone,
}: {
  order: Order;
  updating: boolean;
  onStart: () => void;
  onDone: () => void;
}) {
  const preparing = order.status === "preparing";
  return (
    <div className="rounded-2xl bg-white border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-neutral-900 text-white px-2 py-0.5 text-sm font-semibold">
            โต๊ะ {order.tableNumber}
          </span>
          {order.source === "staff" && (
            <span className="text-xs text-neutral-400">(พนักงานสั่ง)</span>
          )}
        </div>
        <span className="text-xs text-neutral-400">{formatTime(order.createdAt)}</span>
      </div>

      <div className="space-y-1.5 mb-1">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-start justify-between text-sm">
            <div>
              <span className="font-medium">{it.qty} × {it.productName}</span>
              {it.note && <div className="text-neutral-500 text-xs">• {it.note}</div>}
            </div>
          </div>
        ))}
      </div>

      {order.customerNote && (
        <div className="mt-2 rounded-lg bg-amber-50 text-amber-800 text-sm px-3 py-2">
          📝 {order.customerNote}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {!preparing && (
          <button
            onClick={onStart}
            disabled={updating}
            className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold disabled:opacity-50"
          >
            {updating ? "..." : "เริ่มปรุง"}
          </button>
        )}
        {preparing && (
          <button
            onClick={onDone}
            disabled={updating}
            className="flex-1 rounded-lg bg-emerald-600 text-white py-2 text-sm font-semibold disabled:opacity-50"
          >
            {updating ? "..." : "ทำเสร็จ / เสิร์ฟ"}
          </button>
        )}
      </div>
    </div>
  );
}
