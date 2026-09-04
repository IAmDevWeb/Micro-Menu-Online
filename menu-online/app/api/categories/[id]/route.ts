import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";

type RouteCtx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
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
  const updated = (
    await db
      .update(categories)
      .set(parsed.data)
      .where(eq(categories.id, id))
      .returning()
  )[0];
  return NextResponse.json({ category: updated });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "unauthorized" ? 401 : 403 });
  }
  const { id } = await ctx.params;
  await db.delete(schema.categories).where(eq(categories.id, id));
  return NextResponse.json({ ok: true });
}
