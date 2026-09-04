import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";

export async function GET(request: Request) {
  const guard = await requireRole("cashier", "admin", "kitchen");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  const dayRange = { gte: start, lte: end };

  const [paymentAgg, byMethodRows, paidOrders] = await Promise.all([
    prisma.payment.aggregate({
      where: { paidAt: dayRange },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { paidAt: dayRange },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { status: "paid", paidAt: dayRange },
      include: { table: true },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  const orderCount = paidOrders.length;

  const perTableMap = new Map<string, { tableId: string; tableNumber: string; total: number; count: number }>();
  for (const o of paidOrders) {
    const prev = perTableMap.get(o.tableId) || {
      tableId: o.tableId,
      tableNumber: o.table?.tableNumber ?? "",
      total: 0,
      count: 0,
    };
    prev.total += o.total;
    prev.count += 1;
    perTableMap.set(o.tableId, prev);
  }

  const paidOrderIds = paidOrders.map((o) => o.id);
  let topProducts: { productName: string; qty: number; revenue: number }[] = [];
  if (paidOrderIds.length > 0) {
    const grouped = await prisma.orderItem.groupBy({
      by: ["productName"],
      where: { orderId: { in: paidOrderIds } },
      _sum: { qty: true, price: true },
    });
    grouped.sort((a, b) => (b._sum.qty ?? 0) - (a._sum.qty ?? 0));
    topProducts = grouped
      .map((g) => ({
        productName: g.productName,
        qty: g._sum.qty ?? 0,
        revenue: (g._sum.price ?? 0) * (g._sum.qty ?? 0),
      }))
      .slice(0, 10);
  }

  return NextResponse.json({
    date,
    totalRevenue: paymentAgg._sum.amount ?? 0,
    orderCount,
    byMethod: byMethodRows.map((m) => ({
      method: m.method,
      total: m._sum.amount ?? 0,
      count: m._count._all,
    })),
    perTable: [...perTableMap.values()],
    orders: paidOrders.map((o) => ({
      id: o.id,
      tableId: o.tableId,
      tableNumber: o.table?.tableNumber ?? "",
      total: o.total,
      paidAt: o.paidAt,
    })),
    topProducts,
  });
}
