import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import {
  getOrderWithItems,
  serializeOrder,
} from "@/lib/data/orders";

const UpdateSchema = z.object({
  status: z.enum(["preparing", "served", "cancelled"]),
  items: z
    .array(z.object({ id: z.string(), status: z.enum(["pending", "preparing", "done"]) }))
    .optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const order = await getOrderWithItems(id);
  if (!order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }
  const serialized = await serializeOrder(order);
  return NextResponse.json({ order: serialized });
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  const guard = await requireRole("kitchen", "cashier", "admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const order = await getOrderWithItems(id);
  if (!order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }
  if (order.status === "paid" || order.status === "cancelled") {
    return NextResponse.json(
      { error: "ไม่สามารถแก้ไขคำสั่งซื้อที่สิ้นสุดแล้ว" },
      { status: 400 }
    );
  }

  const { status, items } = parsed.data;

  // permission mapping
  if (status === "cancelled" && guard.user.role === "kitchen") {
    return NextResponse.json(
      { error: "ครัวไม่มีสิทธิ์ยกเลิกคำสั่งซื้อ" },
      { status: 403 }
    );
  }
  if (status === "preparing" && guard.user.role === "cashier") {
    return NextResponse.json(
      { error: "แคชเชียร์ไม่มีสิทธิ์เปลี่ยนสถานะการปรุง" },
      { status: 403 }
    );
  }

  await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(status === "cancelled"
        ? { cancelledAt: new Date(), cancelledById: guard.user.id }
        : {}),
    },
  });

  if (items && items.length > 0) {
    for (const it of items) {
      await prisma.orderItem.updateMany({
        where: { id: it.id },
        data: { status: it.status },
      });
    }
  }

  const full = await getOrderWithItems(id);
  const serialized = await serializeOrder(full!);

  return NextResponse.json({ order: serialized });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "unauthorized" ? 401 : 403 });
  }
  const { id } = await ctx.params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
