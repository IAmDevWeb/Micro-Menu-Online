"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/staff/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold">เข้าสู่ระบบพนักงาน</h1>
        <p className="text-sm text-neutral-500 mt-1">
          สำหรับแม่ครัว แคชเชียร์ และผู้ดูแลร้าน
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <input
        type="email"
        required
        placeholder="อีเมล"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
      <input
        type="password"
        required
        placeholder="รหัสผ่าน"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-neutral-900 text-white py-3 font-semibold disabled:opacity-50"
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      <div className="text-xs text-neutral-400 text-center pt-2">
        Demo: admin@menu.local / kitchen@menu.local / cashier@menu.local
        <br />
        รหัสผ่านตามที่ seed ไว้ (admin123456 / kitchen123456 / cashier123456)
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
