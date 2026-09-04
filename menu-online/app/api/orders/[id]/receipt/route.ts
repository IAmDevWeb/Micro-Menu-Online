import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { getOrderWithItems, serializeOrder } from "@/lib/data/orders";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const order = await getOrderWithItems(id);
  if (!order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, id),
    with: { receivedBy: true },
  });

  const serialized = await serializeOrder(order);

  return NextResponse.json({
    receipt: {
      receiptNo: id.split("-")[0] + order.createdAt.slice(11, 19).replace(/:/g, ""),
      order: serialized,
      tableNumber: order.table?.tableNumber ?? "",
      paidAt: order.paidAt,
      method: payment?.method ?? null,
      amount: payment?.amount ?? order.total,
      receivedBy: payment?.receivedBy?.name ?? null,
      createdAt: order.createdAt,
    },
  });
}
