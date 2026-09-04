"use client";

import { useEffect, useState } from "react";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
};

const ROLE_LABEL: Record<string, string> = { admin: "ผู้ดูแล", kitchen: "แม่ครัว", cashier: "แคชเชียร์" };

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"cashier" | "kitchen" | "admin">("cashier");

  async function load() {
    const res = await fetch("/api/users").then((r) => r.json());
    setUsers(res.users || []);
    setLoading(false);
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/users").then((r) => r.json());
        if (!active) return;
        setUsers(res.users || []);
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
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "เพิ่มพนักงานไม่สำเร็จ");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setShowAdd(false);
    setError(null);
    load();
  }

  async function toggleActive(u: StaffUser) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">จัดการพนักงาน</h1>
          <p className="text-sm text-neutral-500">เพิ่ม/แก้ไขสิทธิ์ของแม่ครัว แคชเชียร์ และผู้ดูแล</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="rounded-lg bg-neutral-900 text-white px-4 py-2 font-semibold text-sm">
          + เพิ่มพนักงาน
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

      {showAdd && (
        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ-นามสกุล" className="w-full border rounded-lg px-3 py-2" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล" className="w-full border rounded-lg px-3 py-2" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน" className="w-full border rounded-lg px-3 py-2" />
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="w-full border rounded-lg px-3 py-2">
            <option value="cashier">แคชเชียร์</option>
            <option value="kitchen">แม่ครัว</option>
            <option value="admin">ผู้ดูแล</option>
          </select>
          <button onClick={add} className="w-full rounded-lg bg-emerald-600 text-white py-2 font-semibold">เพิ่ม</button>
        </div>
      )}

      {loading ? (
        <p className="text-neutral-400">กำลังโหลด...</p>
      ) : (
        <div className="bg-white rounded-2xl border divide-y overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className={`flex items-center justify-between px-4 py-3 ${!u.active ? "opacity-50" : ""}`}>
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-neutral-500">
                  {u.email} · {ROLE_LABEL[u.role] || u.role}
                </div>
              </div>
              <button onClick={() => toggleActive(u)} className="text-sm underline text-neutral-600">
                {u.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
