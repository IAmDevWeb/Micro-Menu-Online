"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { tableUrl } from "@/lib/data/qr";

type Table = {
  id: string;
  tableNumber: string;
  qrToken: string;
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/tables").then((r) => r.json());
    setTables(res.tables || []);
    setLoading(false);
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/tables").then((r) => r.json());
        if (!active) return;
        setTables(res.tables || []);
        setLoading(false);
      } catch {
        if (active) setError("โหลดไม่สำเร็จ");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function add() {
    if (!newNumber.trim()) return;
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber: newNumber.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "เพิ่มโต๊ะไม่สำเร็จ");
      return;
    }
    setNewNumber("");
    setShowAdd(false);
    setError(null);
    load();
  }

  async function resetToken(id: string) {
    await fetch(`/api/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrToken: "reset" }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">จัดการโต๊ะ & QR Code</h1>
          <p className="text-sm text-neutral-500">สร้าง QR ใหม่หลังเพิ่มโต๊ะ แล้วพิมพ์แปะที่โต๊ะ</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="rounded-lg bg-neutral-900 text-white px-4 py-2 font-semibold text-sm">
          + เพิ่มโต๊ะ
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

      {showAdd && (
        <div className="flex gap-2 bg-white border rounded-xl p-3">
          <input
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder="เช่น D1"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button onClick={add} className="rounded-lg bg-emerald-600 text-white px-4 py-2 font-semibold">เพิ่ม</button>
        </div>
      )}

      {loading ? (
        <p className="text-neutral-400">กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map((t) => {
            const url = tableUrl(t.id, t.qrToken);
            const isOpen = expanded === t.id;
            return (
              <div key={t.id} className="rounded-2xl bg-white border p-5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">โต๊ะ {t.tableNumber}</span>
                  <Link
                    href={`/staff/tables/${t.id}/print`}
                    target="_blank"
                    className="rounded-lg border px-3 py-1 text-sm font-medium"
                  >
                    พิมพ์ QR
                  </Link>
                </div>
                <button
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="mt-3 w-full rounded-lg bg-neutral-100 py-2 text-sm font-medium"
                >
                  {isOpen ? "ซ่อน QR" : "แสดง QR"}
                </button>
                {isOpen && (
                  <div className="mt-4 flex flex-col items-center space-y-3">
                    <div className="bg-white border rounded-xl p-4">
                      <QRCodeSVG value={url} size={180} />
                    </div>
                    <div className="text-xs text-neutral-500 break-all text-center">{url}</div>
                    <button onClick={() => resetToken(t.id)} className="text-sm text-amber-700 underline">
                      เปลี่ยนรหัส QR ใหม่
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
