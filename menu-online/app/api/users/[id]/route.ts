import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";

type RouteCtx = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "kitchen", "cashier"]).optional(),
  active: z.boolean().optional(),
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
  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
    delete data.password;
  }
  if (data.email) data.email = String(data.email).toLowerCase();
  await db.update(users).set(data).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "unauthorized" ? 401 : 403 });
  }
  const { id } = await ctx.params;
  await db.delete(schema.users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
