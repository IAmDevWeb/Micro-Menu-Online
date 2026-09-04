import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { serializeOrder } from "@/lib/data/orders";
import type { OrderStatus } from "@/lib/db";

const ACTIVE_STATUSES: Record<string, OrderStatus[]> = {
  kitchen: ["pending", "preparing"],
  cashier: ["pending", "preparing", "served"],
  admin: ["pending", "preparing", "served"],
};

export async function GET() {
  const guard = await requireRole("kitchen", "cashier", "admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  const activeStatuses = ACTIVE_STATUSES[guard.user.role] ?? ["pending", "preparing"] as OrderStatus[];
  const rows = await prisma.order.findMany({
    where: { status: { in: activeStatuses } },
    include: { items: true, table: true, createdBy: true },
  });

  const serialized = await Promise.all(rows.map(serializeOrder));

  return NextResponse.json({ orders: serialized });
}
