"use client";

import { useEffect, useState } from "react";
import { formatBaht, formatTime, formatDate } from "@/lib/format";

type Report = {
  date: string;
  totalRevenue: number;
  orderCount: number;
  byMethod: { method: string; total: number; count: number }[];
  perTable: { tableId: string; tableNumber: string; total: number; count: number }[];
  orders: { id: string; tableNumber: string; total: number; paidAt: string }[];
  topProducts: { productName: string; qty: number; revenue: number }[];
};

const METHOD_LABEL: Record<string, string> = { cash: "เงินสด", card: "บัตร", qr: "QR" };

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = !report || report.date !== date;

  useEffect(() => {
    let active = true;
    fetch(`/api/reports/daily?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) {
          setError(data.error);
          setReport(null);
        } else {
          setReport(data);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError("โหลดรายงานไม่สำเร็จ");
      });
    return () => {
      active = false;
    };
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">รายงานยอดขายรายวัน</h1>
          <p className="text-sm text-neutral-500">สรุปยอดขายและบัญชีรายวัน</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

      {loading ? (
        <p className="text-neutral-400">กำลังโหลด...</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-emerald-600 text-white p-5">
              <div className="text-sm opacity-90">ยอดขายรวม</div>
              <div className="text-3xl font-bold mt-1">{formatBaht(report.totalRevenue)}</div>
              <div className="text-xs opacity-80 mt-1">{formatDate(report.date)}</div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-neutral-500">จำนวนใบสั่งที่ชำระ</div>
              <div className="text-3xl font-bold mt-1">{report.orderCount}</div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-neutral-500">เมนูที่ขายดี (หน่วย)</div>
              <div className="mt-2">
                {report.topProducts.slice(0, 3).map((p) => (
                  <div key={p.productName} className="flex justify-between text-sm">
                    <span>{p.productName}</span>
                    <span className="font-medium">{p.qty}</span>
                  </div>
                ))}
                {report.topProducts.length === 0 && <div className="text-sm text-neutral-400">—</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border p-5">
              <h2 className="font-semibold mb-3">ช่องทางการชำระเงิน</h2>
              <div className="space-y-2">
                {report.byMethod.map((m) => (
                  <div key={m.method} className="flex justify-between text-sm">
                    <span>{METHOD_LABEL[m.method] || m.method}</span>
                    <span className="font-medium">{formatBaht(m.total)} ({m.count})</span>
                  </div>
                ))}
                {report.byMethod.length === 0 && <div className="text-sm text-neutral-400">ยังไม่มีรายการ</div>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h2 className="font-semibold mb-3">ยอดขายรายโต๊ะ</h2>
              <div className="space-y-2">
                {report.perTable.map((t) => (
                  <div key={t.tableId} className="flex justify-between text-sm">
                    <span>โต๊ะ {t.tableNumber}</span>
                    <span className="font-medium">{formatBaht(t.total)} ({t.count})</span>
                  </div>
                ))}
                {report.perTable.length === 0 && <div className="text-sm text-neutral-400">ยังไม่มีรายการ</div>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <h2 className="font-semibold mb-3">ใบสั่งที่ชำระแล้ว ({report.orders.length})</h2>
            <div className="divide-y">
              {report.orders.map((o) => (
                <div key={o.id} className="flex justify-between items-center py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">โต๊ะ {o.tableNumber}</span>
                    <a href={`/receipt/${o.id}`} target="_blank" className="text-emerald-700 underline">
                      ใบเสร็จ
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400">{formatTime(o.paidAt)}</span>
                    <span className="font-semibold">{formatBaht(o.total)}</span>
                  </div>
                </div>
              ))}
              {report.orders.length === 0 && <div className="text-sm text-neutral-400 py-2">ยังไม่มีข้อมูล</div>}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
