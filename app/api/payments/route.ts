import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { uid } from "@/lib/utils/uid";
import { getOrderWithItems, serializeOrder } from "@/lib/data/orders";

const PaySchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["cash", "card", "qr"]).default("cash"),
});

export async function POST(request: Request) {
  const guard = await requireRole("cashier", "admin");
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.error },
      { status: guard.error === "unauthorized" ? 401 : 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = PaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลการชำระเงินไม่ถูกต้อง" }, { status: 400 });
  }
  const { orderId, amount, method } = parsed.data;

  const order = await getOrderWithItems(orderId);
  if (!order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "คำสั่งซื้อชำระเงินแล้ว" }, { status: 400 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "คำสั่งซื้อถูกยกเลิกแล้ว" }, { status: 400 });
  }

  await prisma.payment.create({
    data: {
      id: uid(),
      orderId,
      amount,
      method,
      receivedById: guard.user.id,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "paid", paidAt: new Date() },
  });

  const full = await getOrderWithItems(orderId);
  const serialized = await serializeOrder(full!);

  return NextResponse.json({ order: serialized, payment: { orderId, amount, method } });
}
