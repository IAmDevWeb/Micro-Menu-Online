import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { serializeOrder } from "@/lib/data/orders";

const ACTIVE_STATUSES = {
  kitchen: ["pending", "preparing"] as const,
  cashier: ["pending", "preparing", "served"] as const,
  admin: ["pending", "preparing", "served"] as const,
};

export async function GET() {
  const guard = await requireRole("kitchen", "cashier", "admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  const activeStatuses = ACTIVE_STATUSES[guard.user.role] ?? ["pending", "preparing"];
  const rows = await db.query.orders.findMany({
    where: inArray(orders.status, activeStatuses),
    with: { items: true, table: true, createdBy: true },
  });

  const serialized = await Promise.all(rows.map(serializeOrder));

  return NextResponse.json({ orders: serialized });
}
