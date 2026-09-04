import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { uid, generateQrToken } from "@/lib/utils/uid";

export async function GET() {
  const guard = await requireRole("admin", "cashier", "kitchen");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }
  const rows = await prisma.table.findMany({
    orderBy: { tableNumber: "asc" },
  });
  return NextResponse.json({ tables: rows });
}

const CreateSchema = z.object({
  tableNumber: z.string().min(1).max(20),
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
  const row = await prisma.table.create({
    data: { id: uid(), tableNumber: parsed.data.tableNumber, qrToken: generateQrToken() },
  });
  return NextResponse.json({ table: row }, { status: 201 });
}
