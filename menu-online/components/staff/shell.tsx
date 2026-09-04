"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  admin: "ผู้ดูแล",
  kitchen: "แม่ครัว",
  cashier: "แคชเชียร์",
};

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
};

const NAV: NavItem[] = [
  { href: "/staff/dashboard", label: "Dashboard", roles: ["admin", "kitchen", "cashier"] },
  { href: "/staff/products", label: "เมนูอาหาร", roles: ["admin"] },
  { href: "/staff/tables", label: "โต๊ะ & QR", roles: ["admin", "cashier"] },
  { href: "/staff/reports", label: "รายงานยอดขาย", roles: ["admin", "cashier"] },
  { href: "/staff/users", label: "พนักงาน", roles: ["admin"] },
];

export default function StaffShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: Role };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV.filter((n) => n.roles.includes(user.role));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-neutral-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-bold text-lg">🍽️ เมนูออนไลน์</div>
          <div className="text-xs text-white/60 mt-1">ระบบหลังร้าน</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-4 py-2.5 text-sm ${
                  active ? "bg-white/20 font-semibold" : "hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-white/60 mb-3">
            {ROLE_LABEL[user.role]} · {user.email}
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg bg-white/10 py-2 text-sm hover:bg-white/20"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
