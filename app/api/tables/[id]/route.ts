import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { generateQrToken } from "@/lib/utils/uid";

type RouteCtx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  tableNumber: z.string().min(1).max(20).optional(),
  qrToken: z.string().optional(),
});

export async function PATCH(request: Request, ctx: RouteCtx) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "unauthorized" ? 401 : 403 });
  }
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.qrToken && parsed.data.qrToken === "reset") {
    data.qrToken = generateQrToken();
  }
  const updated = await prisma.table.update({
    where: { id },
    data,
  });
  return NextResponse.json({ table: updated });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "unauthorized" ? 401 : 403 });
  }
  const { id } = await ctx.params;
  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
