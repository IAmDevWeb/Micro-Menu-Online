import { NextResponse } from "next/server";
import { z } from "zod";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";
import { uid } from "@/lib/utils/uid";

export async function GET() {
  const rows = await db.select().from(products).orderBy(asc(products.name));
  return NextResponse.json({ products: rows });
}

const CreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  price: z.number().nonnegative(),
  imageUrl: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
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
      .insert(products)
      .values({ id: uid(), ...parsed.data })
      .returning()
  )[0];
  return NextResponse.json({ product: row }, { status: 201 });
}
