import { NextResponse } from "next/server";
import { z } from "zod";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { uid } from "@/lib/utils/uid";

export async function GET() {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return NextResponse.json({ categories: rows });
}

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().optional().default(0),
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
  const row = (
    await db
      .insert(categories)
      .values({ id: uid(), name: parsed.data.name, sortOrder: parsed.data.sortOrder })
      .returning()
  )[0];
  return NextResponse.json({ category: row }, { status: 201 });
}
