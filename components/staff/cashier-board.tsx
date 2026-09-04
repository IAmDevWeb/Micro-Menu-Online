"use client";

import { useMemo, useState } from "react";
import { useStaffOrders } from "@/lib/use-staff-orders";
import { formatBaht, formatTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import StaffOrderModal from "./order-modal";

export default function CashierBoard({ role }: { role: string }) {
  const { orders, loading, connected } = useStaffOrders(role);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [payFor, setPayFor] = useState<Order | null>(null);

  const active = useMemo(
    () =>
      [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders]
  );

  // group totals per table for unpaid active orders
  const perTable = useMemo(() => {
    const map = new Map<string, { tableNumber: string; total: number; count: number; orderIds: string[] }>();
    for (const o of active) {
      const key = o.tableId;
      const entry = map.get(key) || {
        tableNumber: o.tableNumber || "?",
        total: 0,
        count: 0,
        orderIds: [],
      };
      entry.total += o.total;
      entry.count += 1;
      entry.orderIds.push(o.id);
      if (o.status !== "paid") map.set(key, entry);
    }
    return Array.from(map.values());
  }, [active]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">แคชเชียร์ — ยอดเรียกเก็บ</h1>
          <p className="text-sm text-neutral-500">รวมยอดแต่ละโต๊ะแบบเรียลไทม์</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? "bg-emerald-500" : "bg-red-400"
            }`}
          />
          <button
            onClick={() => setShowOrderModal(true)}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 font-semibold text-sm"
          >
            + สั่งอาหารให้ลูกค้า
          </button>
        </div>
      </div>

      {!loading && perTable.length === 0 && (
        <div className="text-center py-16 text-neutral-500">ยังไม่มีออเดอร์ที่ค้างเรียกเก็บ</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {perTable.map((t) => (
          <div key={t.tableNumber} className="rounded-2xl bg-white border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-neutral-900 text-white px-2 py-0.5 text-sm font-semibold">
                โต๊ะ {t.tableNumber}
              </span>
              <span className="text-xs text-neutral-400">{t.count} ออเดอร์</span>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-700">
              {formatBaht(t.total)}
            </div>
            <div className="mt-2 text-xs text-neutral-400">
              กดปุ่มเก็บเงินในแต่ละออเดอร์ด้านล่าง
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 mt-6">ออเดอร์ที่ยังไม่จ่าย</h2>
        <div className="space-y-3">
          {active.map((o) => (
            <CashierRow key={o.id} order={o} onPay={() => setPayFor(o)} />
          ))}
        </div>
      </div>

      {showOrderModal && <StaffOrderModal onClose={() => setShowOrderModal(false)} />}

      {payFor && (
        <PayModal
          order={payFor}
          tableNumber={payFor.tableNumber || ""}
          onClose={() => setPayFor(null)}
        />
      )}
    </div>
  );
}

function CashierRow({ order, onPay }: { order: Order; onPay: () => void }) {
  return (
    <div className="rounded-xl bg-white border p-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">โต๊ะ {order.tableNumber}</span>
          {order.source === "staff" && (
            <span className="text-xs text-neutral-400">(พนักงาน) {order.createdByName}</span>
          )}
          <span className="text-xs text-neutral-400">{formatTime(order.createdAt)}</span>
        </div>
        <div className="text-sm text-neutral-600 mt-0.5">
          {order.items.map((i) => `${i.qty}×${i.productName}`).join(", ")}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-emerald-700">{formatBaht(order.total)}</span>
        <button onClick={onPay} className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-sm font-semibold">
          เก็บเงิน
        </button>
      </div>
    </div>
  );
}

function PayModal({
  order,
  tableNumber,
  onClose,
}: {
  order: Order;
  tableNumber: string;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "card" | "qr">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);

  async function pay() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, amount: order.total, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "บันทึกการชำระไม่สำเร็จ");
        return;
      }
      setPaidOrderId(order.id);
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        {paidOrderId ? (
          <div className="text-center space-y-4">
            <div className="text-3xl">✅</div>
            <h2 className="text-lg font-bold">ชำระเงินสำเร็จ</h2>
            <p className="text-sm text-neutral-500">ยอด {formatBaht(order.total)} · โต๊ะ {tableNumber}</p>
            <a
              href={`/receipt/${paidOrderId}`}
              target="_blank"
              className="block w-full rounded-lg bg-neutral-900 text-white py-2.5 font-semibold"
            >
              เปิดใบเสร็จ / พิมพ์บิล
            </a>
            <button onClick={onClose} className="w-full text-sm text-neutral-500 underline">
              ปิด
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">รับชำระเงิน</h2>
              <button onClick={onClose} className="text-neutral-400 text-2xl leading-none">×</button>
            </div>
            <div className="text-center">
              <div className="text-sm text-neutral-500">โต๊ะ {tableNumber}</div>
              <div className="text-3xl font-bold text-emerald-700">{formatBaht(order.total)}</div>
            </div>
            {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "card", "qr"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-lg border py-2 text-sm font-medium ${
                    method === m ? "bg-neutral-900 text-white border-neutral-900" : "bg-white"
                  }`}
                >
                  {m === "cash" ? "เงินสด" : m === "card" ? "บัตร" : "QR"}
                </button>
              ))}
            </div>
            <button
              onClick={pay}
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-semibold disabled:opacity-50"
            >
              {submitting ? "กำลังบันทึก..." : "ยืนยันการชำระ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
