import { NextResponse } from "next/server";
import { z } from "zod";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
import { uid } from "@/lib/utils/uid";

export async function GET() {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "unauthorized" ? 401 : 403 });
  }
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name));
  return NextResponse.json({ users: rows });
}

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "kitchen", "cashier"]),
});

export async function POST(request: Request) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.error === "unauthorized" ? 401 : 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const row = (
    await db
      .insert(users)
      .values({
        id: uid(),
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        role: parsed.data.role,
      })
      .returning()
  )[0];
  return NextResponse.json(
    { user: { id: row.id, name: row.name, email: row.email, role: row.role, active: row.active } },
    { status: 201 }
  );
}
